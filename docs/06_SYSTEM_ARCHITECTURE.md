# System Architecture

## High-level architecture

```text
Browser
  |
  v
Next.js Frontend
  |
  | REST/JSON
  v
FastAPI Backend
  |
  +--> Historical services
  +--> Timeline query service
  +--> Geographic service
  +--> Search service
  +--> AI orchestration (later)
  |
  v
PostgreSQL + PostGIS
```

## Frontend responsibilities
- application shell
- route handling
- timeline state
- map rendering
- filter/layer state
- API data fetching
- event drawer and entity views
- RTL/Bidi presentation

## Backend responsibilities
- historical query rules
- temporal filtering
- geometry retrieval
- source/provenance data
- search
- API validation
- AI fact-pack construction later

## Database responsibilities
- normalized historical entities
- temporal validity
- spatial data
- source links
- relationships
- editorial status

## Architectural rule: selected year
The selected historical year is a **first-class global application state**.
Most map and context queries derive from it.

## Service modules
Suggested backend structure:

```text
backend/app/
  api/
  core/
  db/
  models/
  schemas/
  services/
    timeline/
    events/
    geography/
    people/
    sources/
    search/
    ai/
```

## Frontend modules

```text
frontend/src/
  app/
  components/
  features/
    map/
    timeline/
    events/
    people/
    search/
  lib/
  styles/
  types/
```

## API versioning
Initial API prefix:
`/api/v1`

## State management
Start with React/Next primitives and a small dedicated client state store only if timeline-map coordination becomes cumbersome. Avoid premature global-state complexity.

## Spatial format
- PostGIS internally
- GeoJSON over API initially
- vector tiles may be introduced later for large boundary datasets
