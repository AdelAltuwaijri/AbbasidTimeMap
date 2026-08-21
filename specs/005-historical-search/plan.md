# Implementation Plan: Historical Search

**Branch**: `main` | **Starting SHA**: `fdea9b8ae870d44ef1c056580e52198e475075c0` | **Date**: 2026-08-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-historical-search/spec.md`

## Summary

Add a compact Arabic-first public search contract over existing Events, People, Places, and States. PostgreSQL performs bounded filtering and ranking through four SQLAlchemy projections combined with one global `UNION ALL`; no corpus is loaded into the browser and no new index service or schema is introduced. Each result contains a deterministic published navigation context. A debounced accessible RTL command control sends selection through the existing central Hijri year, waits for that timeline response, then focuses a point or historical boundary extent and opens only the existing Event drawer where the result contract declares an event context. MapLibre remains one instance and layer visibility is untouched.

## Technical Context

**Language/Version**: Python 3.11 backend; TypeScript 5 / React 19.2 with Next.js 16.3 frontend

**Primary Dependencies**: FastAPI, SQLAlchemy 2, GeoAlchemy2/PostGIS; React, MapLibre GL JS 5.7, native Fetch and AbortController

**Storage**: Existing PostgreSQL 17/PostGIS historical tables; no schema or extension change

**Testing**: pytest plus live PostgreSQL/PostGIS integration, Ruff, Vitest/Testing Library, ESLint, Next.js production build, real-browser review

**Target Platform**: Local REST web application and standards-compliant desktop browser with Arabic RTL support

**Project Type**: Existing monorepo web application

**Performance Goals**: Default 10 and maximum 20 globally ranked results; current corpus search completes comfortably below the one-second settled-input outcome locally

**Constraints**: Arabic-first; 2–100 visible characters after trimming; parameterized query construction; published Event context only; no modern map data; no synthetic geometry; central selected Hijri year only; one MapLibre instance; no M-04 work

**Scale/Scope**: 42 Events, 20 People, 20 Places, 4 States, 3 published boundaries in the 132–170 AH corpus

## Constitution Check

*GATE: Passed before Phase 0 and re-checked after Phase 1.*

- **Arabic-first historical experience**: Arabic labels, context, statuses, combobox semantics, RTL, and Hijri navigation are primary. English matching is secondary and displayed with Bidi-safe markup.
- **Source-proven historical record**: Event results and every event-derived navigation hint are limited to published Events, which the existing publication workflow requires to have sources. Other entities require a published Event or published Boundary relationship.
- **Temporal and spatial fidelity**: Relevant years are stored Hijri years. Point focus uses stored geometry; state focus frames a published temporal Boundary extent. Missing geometry remains missing.
- **Approved stack/schema discipline**: Existing FastAPI, SQLAlchemy, PostgreSQL/PostGIS, Next.js, and MapLibre structures are extended. No schema change means no Alembic migration is required.
- **Simple, scoped delivery**: Query-time expressions fit the current 86-entity corpus. No trigram extension, full-text service, semantic search, profiles, URL-state system, or M-04 experience is added.
- **Post-design result**: PASS. All data and UI contracts reuse existing records and navigation systems; no constitutional exception or complexity waiver is needed.

## Search Query Design

1. Normalize the user query in a dedicated utility and mirror the same transformations as SQL expressions over searched columns.
2. Build one projection per entity type with identical compact columns. Use `EXISTS` or a single ranked navigation context so many-to-many joins cannot duplicate entities.
3. Combine the four projections with `UNION ALL`, order globally by match score, first match position, normalized label length, entity type, relevant year, and slug, then apply the bound result limit.
4. Keep SQLAlchemy statements and normalization in services; the route performs only validation, dependency injection, and response delegation.

### Match tiers

| Tier | Score | Meaning |
|---|---:|---|
| Literal canonical exact | 100 | Trimmed Arabic or English primary label equals the entered form |
| Normalized canonical exact | 90 | Primary label equals after Arabic search normalization |
| Normalized canonical prefix | 80 | Primary label starts with the normalized query |
| Alias exact / normalized exact | 70 | Person alias equals the query |
| Alias prefix | 65 | Person alias begins with the query |
| Normalized canonical partial | 60 | Query occurs within a primary label |
| Alias partial | 50 | Query occurs within a Person alias |
| Stable slug match | 30 or lower | Secondary technical/English discoverability only |

### Navigation context

- **Event**: its own start/end dates, confidence, and existing marker geometry or primary Place point.
- **Person**: one published related Event, preferring a stable identity-relevant event slug, then importance, supported point, earliest Hijri year, and slug. The result names that Event and selecting the Person opens that declared Event context, not a Person profile.
- **Place**: one highest-importance then earliest published related Event supplies context/year. The Place's own point or area bounds supply focus; related Event geometry is not substituted for an unmapped Place.
- **State**: the earliest published Boundary supplies validity years, confidence, and WGS84 bounds. If no published Boundary exists, a deterministic published related Event supplies year/context but not invented state geometry.

## Frontend Navigation Design

- `SearchCommand` owns query/results/open/active-index state, debounces for 250 ms, aborts superseded fetches, and exposes standards-based combobox/listbox keyboard behavior.
- `MapWorkspace` owns pending navigation because it already owns the central Timeline and map selection. Selection dispatches a search-specific Timeline action that sets the year and stops playback.
- Pending navigation is applied only after the matching Timeline response is loaded. Event and Person results may set a drawer Event target by id/slug independently of marker availability; only mapped active Events set the highlighted marker id.
- Place and State results set a compact selected-search context but never impersonate an Event drawer. Point focus uses `flyTo`; Boundary extent uses `fitBounds`; missing focus preserves the camera.
- `HistoricalMap` accepts a request-id-keyed focus request in a separate effect and queues it until map load. Its construction effect remains dependency-free, and search never dispatches layer visibility actions.

## Project Structure

### Documentation (this feature)

```text
specs/005-historical-search/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/search-api.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/app/
├── api/v1/search.py
├── schemas/search.py
├── services/search.py
└── services/search_normalization.py

backend/tests/
├── test_search_api.py
├── test_search_normalization.py
├── test_search_service.py
└── test_search_integration.py

frontend/src/features/search/
├── api/search-client.ts
├── api/search-client.test.ts
├── components/search-command.tsx
├── components/search-command.test.tsx
└── types.ts

frontend/src/features/map/
├── components/historical-map.tsx
├── components/historical-map.test.tsx
├── components/map-workspace.tsx
├── components/map-workspace.test.tsx
└── types.ts

frontend/src/features/timeline/state/
├── timeline-state.ts
└── timeline-state.test.ts

docs/09_API_SPEC.md
docs/21_DECISIONS_LOG.md
```

**Structure Decision**: Extend the existing feature-oriented backend service/router and frontend feature folders. Search is a transient projection and navigation controller, not a new persistent domain entity or alternate map/timeline state store.

## Complexity Tracking

No constitutional violations or unapproved architectural complexity.
