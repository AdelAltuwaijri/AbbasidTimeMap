# API Specification — v1 Baseline

Base prefix: `/api/v1`

## Health
### GET /health
Returns application health.

## Timeline
### GET /timeline/state?year_hijri=145
Returns the historical state for the selected year.

Example response shape:
```json
{
  "year_hijri": 145,
  "year_gregorian_display": "762–763",
  "metadata": {"calendar": "hijri", "granularity": "year"},
  "events": [],
  "event_features": {"type": "FeatureCollection", "features": []},
  "boundaries": {"type": "FeatureCollection", "features": []}
}
```

`year_hijri` is a required positive integer. Events are published Hijri records whose
annual range intersects the selected year. Boundaries are returned only when their
Hijri validity range contains the year; no modern fallback geometry is supplied.

### GET /timeline/events?from_hijri=132&to_hijri=170
Returns event summaries suitable for timeline ticks/clusters.

## Events
### GET /events/{slug}
Returns one published, source-proven, confidence-classified event. Unknown,
non-public, unsourced, or confidence-unclassified records return `404`.

The response keeps the established flat date fields and adds structured
`start_date`/`end_date` objects containing the stored calendar, year, optional
month/day, precision, circa flag, and Arabic/English display labels. This preserves
single dates, year-only dates, mixed-precision ranges, approximate/circa dates, and
disputed dates without calculating unsupported precision. Plain stored Gregorian
labels remain valid Gregorian references; conversion is not inferred at read time.

The public detail includes, when stored:

- Arabic/English titles and summaries, type, primary place, importance, and confidence;
- curated `causes_ar` and `consequences_ar` only—missing values remain missing;
- distinct related People, Places, and States with association metadata;
- distinct sources with identity/type, bibliography, event-specific citation
  locator, support type, reliability note, and a valid `http`/`https` URL.

`editorial_notes` and general Source `notes` are not public fields. Relationship
machine codes remain API metadata and are not presented as untranslated Arabic UI
labels. The embedded source list is deterministic and deduplicated by source
identity, not by title.

### GET /events?year_hijri=145&type=battle
Filtered event list.

## People
### GET /people/{slug}
Returns person detail and related events.

### GET /people?alive_in_hijri=145
Returns people whose known/estimated lifespan intersects the selected year.

## Places
### GET /places/{slug}
Returns place detail and geometry.

## States
### GET /states?active_in_hijri=145
Returns active political entities.

### GET /states/{slug}/boundaries?year_hijri=145
Returns the time-valid boundary geometry.

## Search
### GET /search?q=بغداد&limit=10
Returns one globally ranked compact list across Events, People, Places, and States.

| Parameter | Required | Validation |
|---|---|---|
| `q` | yes | 2–100 visible characters after trimming and search normalization |
| `limit` | no | integer 1–20; default 10 |

Example response:

```json
{
  "query": "بغداد",
  "results": [
    {
      "entity_type": "place",
      "id": "00000000-0000-0000-0000-000000000000",
      "slug": "baghdad",
      "title_ar": "بغداد",
      "title_en": "Baghdad",
      "subtitle_ar": "مكان — تأسيس بغداد، 145هـ",
      "relevant_hijri_year": 145,
      "relevant_end_year": null,
      "coordinates": {"longitude": 44.3661, "latitude": 33.3152},
      "bounds": null,
      "confidence": null,
      "navigation_event_id": "00000000-0000-0000-0000-000000000001",
      "navigation_event_slug": "founding-of-baghdad"
    }
  ]
}
```

Result rules:

- `entity_type` is exactly `event`, `person`, `place`, or `state`.
- Identity, slugs, and Arabic/English titles are original stored values; normalized text is never returned for display.
- `relevant_hijri_year` is always present. The optional end year comes from the selected stored Event or Boundary context.
- `coordinates` are named WGS84 longitude/latitude values. `bounds` use `{west, south, east, north}` with ordered edges. At most one is non-null; both may be null, and no missing geometry is synthesized.
- `navigation_event_id` and `navigation_event_slug` are both present or both null. Event results identify themselves; Person results identify their declared published Event context. Place and State results do not open an Event drawer merely because an Event supplies context.
- A State using Boundary context returns bounds and Boundary confidence, with no navigation Event or centroid.
- Results never exceed `limit` and omit full event detail, biographies, source lists, and Boundary geometry.

Public eligibility rules:

- Event results and every Event-derived navigation context are published only.
- A Person requires an `EventPerson` relationship to at least one published Event.
- A Place requires an `EventPlace` relationship to a published Event or a published Event primary-place relationship.
- A State requires an `EventState` relationship to a published Event or a published PoliticalBoundary.
- Search matches primary names/titles and Person aliases; summaries, biographies, and `modern_reference` are excluded.

Ranking order is literal primary-label exact, normalized primary-label exact, primary-label prefix, Person alias exact/prefix, primary-label partial, Person alias partial, then stable-slug match. Ties use match position, shorter normalized label, entity type, relevant year, and slug.

A valid no-match query returns `200` with `{"query":"…","results":[]}`. Missing, empty, too-short, too-long, normalized-empty queries and limits outside 1–20 return FastAPI `422`. Input is always passed as a bound value and never interpolated into SQL text. An unexpected service failure returns a non-success response; the client preserves the current Timeline, map, layers, and selection.

## Sources
### GET /events/{slug}/sources
Returns source references and, when present, only the event-specific
`EventSource.reliability_note` classified for public display. General
`Source.notes` is never exposed by this public endpoint.

## GeoJSON
Map endpoints may return GeoJSON FeatureCollection where appropriate.

## Error contract
```json
{
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "...",
    "details": null
  }
}
```

## API rules
- No frontend component directly queries the database.
- Public endpoints return only published data.
- Historical confidence and source metadata are not stripped from detailed historical responses.
