# Tasks: F-04 Timeline Engine

**Input**: `specs/001-timeline-engine/` design documents  
**Tests**: Required by the feature request

## Phase 1: Setup

- [X] T001 Record F-04 starting SHA and verify no schema migration is required in `specs/001-timeline-engine/plan.md`

## Phase 2: Foundational

- [X] T002 [P] Define timeline request/response schemas in `backend/app/schemas/timeline.py`
- [X] T003 [P] Define shared timeline types and range configuration in `frontend/src/features/timeline/types.ts`

## Phase 3: User Story 1 - Explore one Hijri year (P1)

**Goal**: Return and render the published historical state for one shared Hijri year.

**Independent Test**: Request a year against fake records and verify event/boundary filtering; select a year in the UI and observe replacement map data.

- [X] T004 [P] [US1] Add API/service temporal and GeoJSON tests in `backend/tests/test_timeline_api.py`
- [X] T005 [US1] Implement annual Hijri event and boundary querying in `backend/app/services/timeline.py`
- [X] T006 [US1] Expose validated timeline state endpoint in `backend/app/api/v1/timeline.py` and register it in `backend/app/main.py`
- [X] T007 [P] [US1] Add frontend timeline API client in `frontend/src/features/timeline/api/timeline-client.ts`
- [X] T008 [P] [US1] Add timeline reducer/hook in `frontend/src/features/timeline/state/timeline-state.ts`
- [X] T009 [US1] Compose year-driven request state and MapLibre data inputs in `frontend/src/features/map/components/map-workspace.tsx`
- [X] T010 [US1] Add timeline state-change tests in `frontend/src/features/map/components/map-workspace.test.tsx`

## Phase 4: User Story 2 - Navigate time predictably (P2)

**Goal**: Provide direct, adjacent, and deterministic playback controls.

**Independent Test**: Drive controls with fake timers and verify a single advancing stream, pause, and upper-bound stop.

- [X] T011 [P] [US2] Add timeline controls and playback tests in `frontend/src/features/timeline/components/timeline-bar.test.tsx`
- [X] T012 [US2] Implement RTL timeline controls, selector, and timer lifecycle in `frontend/src/features/timeline/components/timeline-bar.tsx`
- [X] T013 [US2] Integrate controls with the shared year in `frontend/src/features/map/components/map-workspace.tsx`

## Phase 5: User Story 3 - Preserve map context while changing time (P3)

**Goal**: Retain layer preferences and clear invalid event selection during temporal updates.

**Independent Test**: Hide events then change year; select an event then change to an excluding year.

- [X] T014 [US3] Preserve map UI-layer state and reconcile selection in `frontend/src/features/map/components/map-workspace.tsx`
- [X] T015 [US3] Add layer-persistence and invalid-selection tests in `frontend/src/features/map/components/map-workspace.test.tsx`

## Phase 6: Polish and validation

- [X] T016 [P] Update the timeline endpoint documentation in `docs/09_API_SPEC.md`
- [X] T017 Run F-01–F-04 backend/frontend lint, tests, build, and migration validation from `backend/` and `frontend/`
- [X] T018 Mark completed work and acceptance verification in `specs/001-timeline-engine/tasks.md`

## Dependencies & Execution Order

`T001 → T002/T003 → T004 → T005 → T006 → T007/T008 → T009/T010 → T011/T012/T013 → T014/T015 → T016/T017/T018`.

US1 is the implementation MVP. US2 depends on shared state from US1. US3 depends on year-driven map data from US1. T002, T003, T007, T008, T011, and T016 are parallelizable only where their target files do not overlap.
