"""Globally ranked public historical search over the curated PostgreSQL corpus."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping

from sqlalchemy import (
    Float,
    Integer,
    String,
    and_,
    bindparam,
    case,
    cast,
    func,
    literal,
    null,
    or_,
    select,
    union_all,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import Select
from sqlalchemy.sql.elements import ColumnElement

from app.models.historical import (
    EventPerson,
    EventPlace,
    EventState,
    EventType,
    HistoricalCalendar,
    HistoricalDate,
    HistoricalEvent,
    Person,
    Place,
    PoliticalBoundary,
    PublicationStatus,
    State,
)
from app.schemas.search import (
    SearchBounds,
    SearchCoordinates,
    SearchResponse,
    SearchResult,
)
from app.services.search_normalization import (
    count_visible_search_characters,
    escape_like_pattern,
    normalize_search_expression,
    normalize_search_text,
)

_NO_MATCH_POSITION = 2_147_483_647


@dataclass(frozen=True)
class _MatchMetrics:
    score: ColumnElement[int]
    position: ColumnElement[int]
    label_length: ColumnElement[int]
    predicate: ColumnElement[bool]


def search_historical_entities(
    session: Session, *, query: str, limit: int = 10
) -> SearchResponse:
    """Execute one bounded global search and serialize only compact public fields."""

    trimmed = query.strip()
    statement = build_search_statement(trimmed, limit=limit)
    rows = session.execute(statement).mappings().all()
    return SearchResponse(
        query=trimmed,
        results=[_serialize_result(row) for row in rows],
    )


def build_search_statement(query: str, *, limit: int = 10) -> Select[Any]:
    """Build four public entity projections followed by one global rank and limit."""

    trimmed = query.strip()
    normalized = normalize_search_text(trimmed)
    visible_length = count_visible_search_characters(normalized)
    if not 2 <= visible_length <= 100:
        raise ValueError("query must contain 2-100 visible characters after normalization")
    if not 1 <= limit <= 20:
        raise ValueError("limit must be between 1 and 20")

    parameters = _search_parameters(trimmed, normalized)
    public_events = _published_event_contexts()
    projections = (
        _event_projection(public_events, parameters),
        _person_projection(public_events, parameters),
        _place_projection(public_events, parameters),
        _state_projection(public_events, parameters),
    )
    ranked = union_all(*projections).subquery("ranked_search_results")

    return (
        select(
            ranked.c.entity_type,
            ranked.c.id,
            ranked.c.slug,
            ranked.c.title_ar,
            ranked.c.title_en,
            ranked.c.subtitle_ar,
            ranked.c.relevant_hijri_year,
            ranked.c.relevant_end_year,
            ranked.c.longitude,
            ranked.c.latitude,
            ranked.c.west,
            ranked.c.south,
            ranked.c.east,
            ranked.c.north,
            ranked.c.confidence,
            ranked.c.navigation_event_id,
            ranked.c.navigation_event_slug,
        )
        .order_by(
            ranked.c.match_score.desc(),
            ranked.c.match_position,
            ranked.c.label_length,
            ranked.c.type_order,
            ranked.c.relevant_hijri_year,
            ranked.c.slug,
        )
        .limit(bindparam("search_limit", value=limit, type_=Integer()))
    )


def _search_parameters(trimmed: str, normalized: str) -> dict[str, str]:
    escaped = escape_like_pattern(normalized)
    slug_query = escape_like_pattern(normalized.replace(" ", "-"))
    return {
        "literal": trimmed.lower(),
        "normalized": normalized,
        "prefix": f"{escaped}%",
        "partial": f"%{escaped}%",
        "slug_partial": f"%{slug_query}%",
    }


def _published_event_contexts():
    start = aliased(HistoricalDate, name="search_event_start")
    end = aliased(HistoricalDate, name="search_event_end")
    primary_place = aliased(Place, name="search_event_primary_place")
    marker = func.ST_PointOnSurface(
        func.coalesce(HistoricalEvent.primary_geometry, primary_place.point)
    )

    return (
        select(
            HistoricalEvent.id.label("event_id"),
            HistoricalEvent.slug.label("event_slug"),
            HistoricalEvent.title_ar.label("event_title_ar"),
            HistoricalEvent.title_en.label("event_title_en"),
            EventType.name_ar.label("event_type_name_ar"),
            start.year.label("start_year"),
            case(
                (end.calendar == HistoricalCalendar.HIJRI.value, end.year),
                else_=None,
            ).label("end_year"),
            HistoricalEvent.primary_place_id.label("primary_place_id"),
            HistoricalEvent.importance.label("importance"),
            HistoricalEvent.confidence_level.label("event_confidence"),
            marker.label("marker"),
        )
        .join(start, HistoricalEvent.start_date_id == start.id)
        .outerjoin(end, HistoricalEvent.end_date_id == end.id)
        .outerjoin(EventType, HistoricalEvent.event_type_id == EventType.id)
        .outerjoin(primary_place, HistoricalEvent.primary_place_id == primary_place.id)
        .where(
            HistoricalEvent.publication_status
            == PublicationStatus.PUBLISHED.value,
            start.calendar == HistoricalCalendar.HIJRI.value,
        )
        .subquery("search_public_events")
    )


def _event_projection(public_events, parameters: Mapping[str, str]):
    matches = _match_metrics(
        public_events.c.event_title_ar,
        public_events.c.event_title_en,
        public_events.c.event_slug,
        parameters,
    )
    longitude, latitude = _point_values(public_events.c.marker)
    return (
        select(
            _entity_type("event"),
            public_events.c.event_id.label("id"),
            public_events.c.event_slug.label("slug"),
            public_events.c.event_title_ar.label("title_ar"),
            public_events.c.event_title_en.label("title_en"),
            func.concat(
                "حدث — ",
                func.coalesce(public_events.c.event_type_name_ar, "سجل تاريخي"),
                "، ",
                public_events.c.start_year,
                "هـ",
            ).label("subtitle_ar"),
            public_events.c.start_year.label("relevant_hijri_year"),
            public_events.c.end_year.label("relevant_end_year"),
            longitude,
            latitude,
            *_null_bounds(),
            public_events.c.event_confidence.label("confidence"),
            public_events.c.event_id.label("navigation_event_id"),
            public_events.c.event_slug.label("navigation_event_slug"),
            matches.score.label("match_score"),
            matches.position.label("match_position"),
            matches.label_length.label("label_length"),
            literal(0, type_=Integer()).label("type_order"),
        )
        .where(matches.predicate)
    )


def _person_projection(public_events, parameters: Mapping[str, str]):
    supported_point_order = case(
        (public_events.c.marker.is_not(None), 0), else_=1
    )
    identity_event_order = case(
        (func.strpos(public_events.c.event_slug, Person.slug) > 0, 0), else_=1
    )
    ranked_contexts = (
        select(
            EventPerson.person_id.label("entity_id"),
            public_events.c.event_id,
            public_events.c.event_slug,
            public_events.c.event_title_ar,
            public_events.c.start_year,
            public_events.c.end_year,
            public_events.c.marker,
            func.row_number()
            .over(
                partition_by=EventPerson.person_id,
                order_by=(
                    identity_event_order,
                    func.coalesce(public_events.c.importance, 0).desc(),
                    supported_point_order,
                    public_events.c.start_year,
                    public_events.c.event_slug,
                    public_events.c.event_id,
                ),
            )
            .label("context_rank"),
        )
        .select_from(EventPerson)
        .join(public_events, EventPerson.event_id == public_events.c.event_id)
        .join(Person, Person.id == EventPerson.person_id)
        .subquery("ranked_person_contexts")
    )
    context = (
        select(ranked_contexts)
        .where(ranked_contexts.c.context_rank == 1)
        .subquery("person_context")
    )
    matches = _match_metrics(
        Person.canonical_name_ar,
        Person.canonical_name_en,
        Person.slug,
        parameters,
        alias=Person.aliases,
    )
    longitude, latitude = _point_values(context.c.marker)

    return (
        select(
            _entity_type("person"),
            Person.id.label("id"),
            Person.slug.label("slug"),
            Person.canonical_name_ar.label("title_ar"),
            Person.canonical_name_en.label("title_en"),
            func.concat(
                "شخصية — ",
                context.c.event_title_ar,
                "، ",
                context.c.start_year,
                "هـ",
            ).label("subtitle_ar"),
            context.c.start_year.label("relevant_hijri_year"),
            context.c.end_year.label("relevant_end_year"),
            longitude,
            latitude,
            *_null_bounds(),
            Person.confidence_level.label("confidence"),
            context.c.event_id.label("navigation_event_id"),
            context.c.event_slug.label("navigation_event_slug"),
            matches.score.label("match_score"),
            matches.position.label("match_position"),
            matches.label_length.label("label_length"),
            literal(1, type_=Integer()).label("type_order"),
        )
        .select_from(Person)
        .join(context, context.c.entity_id == Person.id)
        .where(matches.predicate)
    )


def _place_projection(public_events, parameters: Mapping[str, str]):
    related_candidates = select(
        EventPlace.place_id.label("entity_id"),
        public_events.c.event_id,
        public_events.c.event_slug,
        public_events.c.event_title_ar,
        public_events.c.start_year,
        public_events.c.end_year,
        public_events.c.importance,
        literal(1, type_=Integer()).label("relation_order"),
    ).join(public_events, EventPlace.event_id == public_events.c.event_id)
    primary_candidates = select(
        public_events.c.primary_place_id.label("entity_id"),
        public_events.c.event_id,
        public_events.c.event_slug,
        public_events.c.event_title_ar,
        public_events.c.start_year,
        public_events.c.end_year,
        public_events.c.importance,
        literal(0, type_=Integer()).label("relation_order"),
    ).where(public_events.c.primary_place_id.is_not(None))
    candidates = union_all(related_candidates, primary_candidates).subquery(
        "place_event_candidates"
    )
    ranked_contexts = (
        select(
            candidates,
            func.row_number()
            .over(
                partition_by=candidates.c.entity_id,
                order_by=(
                    func.coalesce(candidates.c.importance, 0).desc(),
                    candidates.c.start_year,
                    candidates.c.event_slug,
                    candidates.c.relation_order,
                    candidates.c.event_id,
                ),
            )
            .label("context_rank"),
        )
        .subquery("ranked_place_contexts")
    )
    context = (
        select(ranked_contexts)
        .where(ranked_contexts.c.context_rank == 1)
        .subquery("place_context")
    )
    matches = _match_metrics(
        Place.name_ar, Place.name_en, Place.slug, parameters
    )
    longitude, latitude = _point_values(Place.point)
    west, south, east, north = _area_bounds(Place.point, Place.area)

    return (
        select(
            _entity_type("place"),
            Place.id.label("id"),
            Place.slug.label("slug"),
            Place.name_ar.label("title_ar"),
            Place.name_en.label("title_en"),
            func.concat(
                "مكان — ",
                context.c.event_title_ar,
                "، ",
                context.c.start_year,
                "هـ",
            ).label("subtitle_ar"),
            context.c.start_year.label("relevant_hijri_year"),
            context.c.end_year.label("relevant_end_year"),
            longitude,
            latitude,
            west,
            south,
            east,
            north,
            cast(null(), String()).label("confidence"),
            context.c.event_id.label("navigation_event_id"),
            context.c.event_slug.label("navigation_event_slug"),
            matches.score.label("match_score"),
            matches.position.label("match_position"),
            matches.label_length.label("label_length"),
            literal(2, type_=Integer()).label("type_order"),
        )
        .select_from(Place)
        .join(context, context.c.entity_id == Place.id)
        .where(matches.predicate)
    )


def _state_projection(public_events, parameters: Mapping[str, str]):
    boundary_context = _state_boundary_context()
    event_context = _state_event_context(public_events)
    matches = _match_metrics(State.name_ar, State.name_en, State.slug, parameters)
    has_boundary = boundary_context.c.boundary_id.is_not(None)

    boundary_subtitle = case(
        (
            boundary_context.c.end_year.is_not(None),
            func.concat(
                "كيان سياسي — حدود تاريخية، ",
                boundary_context.c.start_year,
                "–",
                boundary_context.c.end_year,
                "هـ",
            ),
        ),
        else_=func.concat(
            "كيان سياسي — حدود تاريخية، ",
            boundary_context.c.start_year,
            "هـ",
        ),
    )
    event_subtitle = func.concat(
        "كيان سياسي — ",
        event_context.c.event_title_ar,
        "، ",
        event_context.c.start_year,
        "هـ",
    )

    return (
        select(
            _entity_type("state"),
            State.id.label("id"),
            State.slug.label("slug"),
            State.name_ar.label("title_ar"),
            State.name_en.label("title_en"),
            case((has_boundary, boundary_subtitle), else_=event_subtitle).label(
                "subtitle_ar"
            ),
            func.coalesce(
                boundary_context.c.start_year, event_context.c.start_year
            ).label("relevant_hijri_year"),
            case(
                (has_boundary, boundary_context.c.end_year),
                else_=event_context.c.end_year,
            ).label("relevant_end_year"),
            cast(null(), Float()).label("longitude"),
            cast(null(), Float()).label("latitude"),
            boundary_context.c.west.label("west"),
            boundary_context.c.south.label("south"),
            boundary_context.c.east.label("east"),
            boundary_context.c.north.label("north"),
            boundary_context.c.boundary_confidence.label("confidence"),
            case(
                (has_boundary, cast(null(), UUID(as_uuid=True))),
                else_=event_context.c.event_id,
            ).label("navigation_event_id"),
            case(
                (has_boundary, cast(null(), String())),
                else_=event_context.c.event_slug,
            ).label("navigation_event_slug"),
            matches.score.label("match_score"),
            matches.position.label("match_position"),
            matches.label_length.label("label_length"),
            literal(3, type_=Integer()).label("type_order"),
        )
        .select_from(State)
        .outerjoin(boundary_context, boundary_context.c.entity_id == State.id)
        .outerjoin(event_context, event_context.c.entity_id == State.id)
        .where(
            or_(
                boundary_context.c.boundary_id.is_not(None),
                event_context.c.event_id.is_not(None),
            ),
            matches.predicate,
        )
    )


def _state_boundary_context():
    valid_from = aliased(HistoricalDate, name="search_boundary_start")
    valid_to = aliased(HistoricalDate, name="search_boundary_end")
    box = func.Box2D(PoliticalBoundary.geometry)
    ranked = (
        select(
            PoliticalBoundary.state_id.label("entity_id"),
            PoliticalBoundary.id.label("boundary_id"),
            PoliticalBoundary.slug.label("boundary_slug"),
            valid_from.year.label("start_year"),
            case(
                (valid_to.calendar == HistoricalCalendar.HIJRI.value, valid_to.year),
                else_=None,
            ).label("end_year"),
            PoliticalBoundary.confidence_level.label("boundary_confidence"),
            func.ST_XMin(box).label("west"),
            func.ST_YMin(box).label("south"),
            func.ST_XMax(box).label("east"),
            func.ST_YMax(box).label("north"),
            func.row_number()
            .over(
                partition_by=PoliticalBoundary.state_id,
                order_by=(valid_from.year, PoliticalBoundary.slug, PoliticalBoundary.id),
            )
            .label("context_rank"),
        )
        .join(valid_from, PoliticalBoundary.valid_from_date_id == valid_from.id)
        .outerjoin(valid_to, PoliticalBoundary.valid_to_date_id == valid_to.id)
        .where(
            PoliticalBoundary.publication_status
            == PublicationStatus.PUBLISHED.value,
            valid_from.calendar == HistoricalCalendar.HIJRI.value,
            or_(
                PoliticalBoundary.valid_to_date_id.is_(None),
                valid_to.calendar == HistoricalCalendar.HIJRI.value,
            ),
        )
        .subquery("ranked_state_boundary_contexts")
    )
    return (
        select(ranked)
        .where(ranked.c.context_rank == 1)
        .subquery("state_boundary_context")
    )


def _state_event_context(public_events):
    ranked = (
        select(
            EventState.state_id.label("entity_id"),
            public_events.c.event_id,
            public_events.c.event_slug,
            public_events.c.event_title_ar,
            public_events.c.start_year,
            public_events.c.end_year,
            func.row_number()
            .over(
                partition_by=EventState.state_id,
                order_by=(
                    func.coalesce(public_events.c.importance, 0).desc(),
                    public_events.c.start_year,
                    public_events.c.event_slug,
                    public_events.c.event_id,
                ),
            )
            .label("context_rank"),
        )
        .select_from(EventState)
        .join(public_events, EventState.event_id == public_events.c.event_id)
        .subquery("ranked_state_event_contexts")
    )
    return (
        select(ranked)
        .where(ranked.c.context_rank == 1)
        .subquery("state_event_context")
    )


def _match_metrics(
    primary_ar: ColumnElement[str],
    primary_en: ColumnElement[str | None],
    slug: ColumnElement[str],
    parameters: Mapping[str, str],
    *,
    alias: ColumnElement[str | None] | None = None,
) -> _MatchMetrics:
    literal_query = bindparam("search_literal", value=parameters["literal"])
    normalized_query = bindparam("search_normalized", value=parameters["normalized"])
    prefix_query = bindparam("search_prefix", value=parameters["prefix"])
    partial_query = bindparam("search_partial", value=parameters["partial"])
    slug_query = bindparam("search_slug_partial", value=parameters["slug_partial"])

    normalized_ar = normalize_search_expression(primary_ar)
    normalized_en = normalize_search_expression(primary_en)
    normalized_alias = normalize_search_expression(alias) if alias is not None else None
    literal_ar = func.lower(func.btrim(primary_ar))
    literal_en = func.lower(func.btrim(func.coalesce(primary_en, "")))

    literal_exact = or_(literal_ar == literal_query, literal_en == literal_query)
    primary_exact = or_(
        normalized_ar == normalized_query, normalized_en == normalized_query
    )
    primary_prefix = or_(
        normalized_ar.like(prefix_query, escape="\\"),
        normalized_en.like(prefix_query, escape="\\"),
    )
    primary_partial = or_(
        normalized_ar.like(partial_query, escape="\\"),
        normalized_en.like(partial_query, escape="\\"),
    )
    alias_exact = (
        normalized_alias == normalized_query
        if normalized_alias is not None
        else literal(False)
    )
    alias_prefix = (
        normalized_alias.like(prefix_query, escape="\\")
        if normalized_alias is not None
        else literal(False)
    )
    alias_partial = (
        normalized_alias.like(partial_query, escape="\\")
        if normalized_alias is not None
        else literal(False)
    )
    slug_partial = func.lower(slug).like(slug_query, escape="\\")

    score = case(
        (literal_exact, 100),
        (primary_exact, 90),
        (primary_prefix, 80),
        (alias_exact, 70),
        (alias_prefix, 65),
        (primary_partial, 60),
        (alias_partial, 50),
        (slug_partial, 30),
        else_=0,
    )
    positions = [
        func.coalesce(
            func.nullif(func.strpos(normalized_ar, normalized_query), 0),
            _NO_MATCH_POSITION,
        ),
        func.coalesce(
            func.nullif(func.strpos(normalized_en, normalized_query), 0),
            _NO_MATCH_POSITION,
        ),
    ]
    if normalized_alias is not None:
        positions.append(
            func.coalesce(
                func.nullif(func.strpos(normalized_alias, normalized_query), 0),
                _NO_MATCH_POSITION,
            )
        )
    positions.append(
        func.coalesce(
            func.nullif(func.strpos(func.lower(slug), normalized_query), 0),
            _NO_MATCH_POSITION,
        )
    )
    predicate = or_(
        literal_exact,
        primary_exact,
        primary_prefix,
        alias_exact,
        alias_prefix,
        primary_partial,
        alias_partial,
        slug_partial,
    )
    return _MatchMetrics(
        score=score,
        position=func.least(*positions),
        label_length=func.length(normalized_ar),
        predicate=predicate,
    )


def _point_values(point: ColumnElement[Any]):
    return (
        case((point.is_not(None), func.ST_X(point)), else_=None).label("longitude"),
        case((point.is_not(None), func.ST_Y(point)), else_=None).label("latitude"),
    )


def _area_bounds(point: ColumnElement[Any], area: ColumnElement[Any]):
    box = func.Box2D(area)
    no_point = point.is_(None)
    return (
        case((and_(no_point, area.is_not(None)), func.ST_XMin(box)), else_=None).label(
            "west"
        ),
        case((and_(no_point, area.is_not(None)), func.ST_YMin(box)), else_=None).label(
            "south"
        ),
        case((and_(no_point, area.is_not(None)), func.ST_XMax(box)), else_=None).label(
            "east"
        ),
        case((and_(no_point, area.is_not(None)), func.ST_YMax(box)), else_=None).label(
            "north"
        ),
    )


def _null_bounds():
    return (
        cast(null(), Float()).label("west"),
        cast(null(), Float()).label("south"),
        cast(null(), Float()).label("east"),
        cast(null(), Float()).label("north"),
    )


def _entity_type(value: str):
    return cast(literal(value), String()).label("entity_type")


def _serialize_result(row: Mapping[str, Any]) -> SearchResult:
    coordinates = None
    if row["longitude"] is not None and row["latitude"] is not None:
        coordinates = SearchCoordinates(
            longitude=row["longitude"], latitude=row["latitude"]
        )

    bounds = None
    if all(row[name] is not None for name in ("west", "south", "east", "north")):
        bounds = SearchBounds(
            west=row["west"],
            south=row["south"],
            east=row["east"],
            north=row["north"],
        )

    return SearchResult(
        entity_type=row["entity_type"],
        id=row["id"],
        slug=row["slug"],
        title_ar=row["title_ar"],
        title_en=row["title_en"],
        subtitle_ar=row["subtitle_ar"],
        relevant_hijri_year=row["relevant_hijri_year"],
        relevant_end_year=row["relevant_end_year"],
        coordinates=coordinates,
        bounds=bounds,
        confidence=row["confidence"],
        navigation_event_id=row["navigation_event_id"],
        navigation_event_slug=row["navigation_event_slug"],
    )
