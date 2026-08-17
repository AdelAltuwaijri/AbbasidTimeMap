# Acceptance Criteria

## F-01 Project Foundation
- repository has `frontend`, `backend`, `data`, `docs`
- frontend starts successfully
- backend starts successfully
- `/api/v1/health` returns healthy response
- PostgreSQL/PostGIS connection is configurable
- `.env.example` files exist
- no secrets committed
- lint/build baseline succeeds

## F-02 Historical Data Model
- migrations create all MVP core tables
- PostGIS extension enabled
- spatial columns and GIST indexes exist
- event can link to people/places/states/sources
- uncertain historical dates supported
- published event without source is rejected by validation or publication workflow
- model tests pass

## F-03 Map Foundation
- map renders in main page
- RTL application shell does not break map controls
- API GeoJSON can render at least one event marker
- layer visibility can be toggled
- selected marker can be highlighted

## F-04 Timeline Engine
- selected Hijri year is visible
- user can change year
- map event features update without full reload
- API returns state for year
- political boundary query is year-aware
- play/pause works within configured corpus range

## F-05 First Interactive Historical Event
- one real sourced Abbasid event exists in database
- event appears at correct year
- event appears at mapped location
- clicking it opens detail drawer
- drawer shows date, summary, confidence, and source

## M-01 Seed Corpus
- target record counts reached or documented deviations approved
- all published records have sources
- no invalid temporal ranges
- all mapped coordinates/geometries pass basic validation

## M-02 Boundaries
- at least multiple dated boundary states can be rendered
- year transition changes boundary when applicable
- boundary source/provenance stored

## M-03 Search
- Arabic search returns relevant entities
- selecting result navigates to relevant time
- mapped result focuses location where available

## M-04 Event Experience
- causes/consequences displayed when available
- source list displayed
- confidence explained to user
- related people/states navigable

## M-05 Journeys
- journey has ordered steps
- play advances time and map focus
- user can pause/exit journey

## MVP release
- critical user path passes E2E test
- desktop experience stable
- responsive web acceptable
- accessibility baseline checked
- performance issues documented/resolved to agreed threshold
- no unsourced AI-generated historical claims presented as facts
