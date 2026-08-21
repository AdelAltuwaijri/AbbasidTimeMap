# Implementation Plan: Historical Event Experience

**Branch**: `main` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-event-experience/spec.md`

## Summary

Expand the existing published-event projection and drawer into a sourced,
uncertainty-aware Arabic historical reading experience. The backend will expose
the already-stored structured dates, causes, consequences, relationship roles,
related places, and source provenance without exposing editorial fields. The
frontend will render only populated sections, reuse the M-03 navigation pipeline
for related people and states, preserve the existing Timeline/MapLibre selection
semantics, manage keyboard focus, and cache successful event details for the
current client session. No database migration or new dependency is required.

## Technical Context

**Language/Version**: Python 3.11; TypeScript 5; React 19.2; Node.js 20-compatible runtime
**Primary Dependencies**: FastAPI, SQLAlchemy 2, Pydantic, Next.js 16.3, React 19.2, MapLibre GL JS 5.7, Tailwind CSS 4
**Storage**: Existing PostgreSQL/PostGIS database; no schema change
**Testing**: pytest 8, live PostgreSQL integration tests, Vitest 4 + Testing Library, ESLint 9, Next production build, real-browser acceptance checks
**Target Platform**: Local web application on current evergreen desktop/mobile browsers
**Project Type**: FastAPI service plus Next.js web client
**Performance Goals**: An uncached local event detail is readable within one second; reopening a cached detail performs no new request; drawer transitions do not reload the page
**Constraints**: Arabic-first RTL/Bidi; Hijri chronology primary; public published/source-proven records only; no modern political labels/bounds; no generated historical prose; no M-05 work
**Scale/Scope**: Current curated corpus of 42 published events across 132–170 AH, 20 people, 20 places, 4 states, and existing M-03/M-02 navigation data

## Constitution Check

*GATE: Passed before Phase 0 and re-checked after Phase 1 design.*

| Principle | Design evidence | Result |
|---|---|---|
| Historical integrity | The API projects stored fields only; absent causes/consequences remain absent; disputed and approximate values are preserved. | PASS |
| Source provenance | Public details require a published event with at least one EventSource; citations retain locator/support/reliability metadata. | PASS |
| Transparency and uncertainty | Structured start/end dates preserve precision and circa; UI explains confidence neutrally. | PASS |
| Arabic-first RTL | Arabic labels and semantic sections are primary; English/source strings receive explicit Bidi direction where needed. | PASS |
| Accessible interaction | Dialog semantics, initial/return focus, Escape, keyboard containment, semantic headings, and scroll behavior are covered by tests. | PASS |
| Temporal consistency | Related navigation calls the existing M-03 sequence and uses the shared selected Hijri year; no parallel time state is introduced. | PASS |
| Geospatial integrity | Existing event geometry and historical state bounds are reused; no point, centroid, modern boundary, or basemap label is invented. | PASS |
| Small reviewable change | Existing tables and dependencies are sufficient; changes remain in event projection, drawer, workspace integration, tests, and package docs. | PASS |
| Package boundary | M-04 only; profiles, journeys, AI explanations, admin workflows, and M-05 remain excluded. | PASS |

Post-design re-check: PASS. The API contract is additive, the client reuses
existing search/timeline/map mechanisms, and the design introduces no exception
to the constitution.

## Project Structure

### Documentation (this feature)

```text
specs/006-event-experience/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── event-detail.openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/v1/events.py
│   ├── schemas/events.py
│   └── services/events.py
└── tests/
    ├── test_events_api.py
    └── test_events_integration.py

frontend/
└── src/features/
    ├── events/
    │   ├── api/event-client.ts
    │   ├── components/event-drawer.tsx
    │   └── types.ts
    └── map/components/map-workspace.tsx
```

**Structure Decision**: Retain the established split FastAPI/Next.js structure.
The backend owns public projection and publication/provenance enforcement; the
frontend owns localized presentation, focus behavior, caching, and reuse of the
existing M-03 navigation controller in `MapWorkspace`.

## Implementation Strategy

1. Add failing backend contract/service tests for structured date uncertainty,
   optional narrative fields, typed relationships, distinct sources, safe URLs,
   publication/provenance filtering, and private-field exclusion.
2. Implement the additive event response and deterministic projections without a
   model or migration change.
3. Add failing frontend type-guard and drawer tests for every conditional section,
   confidence/date wording, sources, related actions, accessibility, and responsive
   surface classes.
4. Implement the drawer and client-session detail cache, then connect related
   person/state controls to the existing M-03 result navigation.
5. Run backend/frontend full regressions, live API probes, and real-browser checks
   at 1280px, 768px, and 390px before updating the package task record.

## Complexity Tracking

No constitution violations or exceptional complexity are introduced.
