# Tasks: First Interactive Historical Event (F-05)

**Input**: Design documents from `/specs/002-interactive-historical-event/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/event-detail.md, quickstart.md

## Phase 1: Setup

- [x] T001 Verify the current branch is `main`, capture starting SHA, and confirm no schema change is needed from `specs/002-interactive-historical-event/data-model.md`.

## Phase 2: Foundational data and detail API

- [x] T002 [P] Add failing detail, publication/source, place/state/person relation, timeline-year, and unknown-slug tests in `backend/tests/test_events_api.py` and `backend/tests/test_founding_of_baghdad_seed.py`.
- [x] T003 Create the idempotent source-backed Baghdad seed module in `backend/app/seeds/founding_of_baghdad.py` and ensure it is never called from application startup.
- [x] T004 Implement event detail projection schemas in `backend/app/schemas/events.py` and query service in `backend/app/services/events.py`.
- [x] T005 Add `GET /api/v1/events/{slug}` in `backend/app/api/v1/events.py` and register it in `backend/app/main.py`.
- [ ] T006 Run the seed against a migrated local database twice to verify idempotency and published-source integrity.

## Phase 3: User Story 1 — Explore the founding of Baghdad (P1)

**Goal**: A marker at 145 AH opens a sourced, RTL event drawer.

**Independent Test**: Mock the timeline and detail APIs; select the marker and verify content and keyboard-operable close behavior.

- [x] T007 [P] [US1] Add failing drawer rendering, source/date/confidence, loading, close-focus, and API-failure tests in `frontend/src/features/map/components/map-workspace.test.tsx`.
- [x] T008 [US1] Add validated event-detail API client/types in `frontend/src/features/events/api/event-client.ts` and `frontend/src/features/events/types.ts`.
- [x] T009 [US1] Implement the accessible Arabic `EventDrawer` with Bidi-safe date/source output in `frontend/src/features/events/components/event-drawer.tsx`.
- [x] T010 [US1] Integrate marker selection, focus/fly-to, drawer loading/content/error lifecycle, and close behavior into `frontend/src/features/map/components/map-workspace.tsx` and `frontend/src/features/map/components/historical-map.tsx`.

## Phase 4: User Story 2 — Time synchronization (P2)

**Goal**: A selection clears when an active event drops out of the selected year.

**Independent Test**: Open the seeded event at 145 AH, transition to 146 AH, and assert drawer plus marker selection are cleared while timeline state changes normally.

- [x] T011 [US2] Extend `frontend/src/features/map/components/map-workspace.test.tsx` with active-year drawer clearing and marker synchronization coverage.
- [x] T012 [US2] Ensure `frontend/src/features/map/components/map-workspace.tsx` cancels stale detail requests and clears its detail state with the existing map selection when fresh year data excludes the event.

## Phase 5: User Story 3 — Safe detail failure (P3)

**Goal**: Detail fetch failure is clearly recoverable without changing time or rebuilding map.

**Independent Test**: Fail then retry the detail call in the UI test and verify returned content and unchanged selected year.

- [x] T013 [US3] Complete the retry/error-path test and Arabic failure/retry handling in `frontend/src/features/map/components/map-workspace.test.tsx` and `frontend/src/features/events/components/event-drawer.tsx`.

## Phase 6: Verification and handoff

- [x] T014 Run backend pytest/Ruff and frontend Vitest/ESLint/build; repair findings in the directly relevant files.
- [ ] T015 Perform the quickstart manual path with a local migrated database and running frontend/backend; document result in the final report.
- [ ] T016 Mark completed tasks, review `git diff`/status, commit with `feat: implement F-05 first interactive historical event`, and push `main` to `origin/main`.

## Dependencies & Execution Order

`T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016`

`T002` and `T007` are independent test-first work. All remaining work follows the data/detail flow before the UI integration flow.

## Implementation Strategy

Deliver the one event and public detail API first, then prove the marker-to-drawer interaction. Temporal clearing and error recovery build on that flow. No task adds M-01 records, AI, search, journeys, or admin UI.
