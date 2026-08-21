# Tasks: Historical Search

**Input**: Design documents from `/specs/005-historical-search/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by the specification. Test tasks precede their corresponding implementation tasks.

## Phase 1: Setup and Governance

**Purpose**: Confirm the M-03 boundary and record the adopted search policy before implementation.

- [X] T001 Verify `main`, record Starting SHA, inspect ignore rules, and confirm M-03 needs no schema/Alembic or dependency change in `.gitignore`, `backend/`, and `frontend/`
- [X] T002 Record conservative Arabic search normalization, public-entity eligibility, deterministic ranking/context, Boundary-bounds focus, URL-state deferral, and no year-result deviation in `docs/21_DECISIONS_LOG.md`
- [X] T003 Update the bounded compact `/api/v1/search` contract in `docs/09_API_SPEC.md`

---

## Phase 2: Foundational Search Contract

**Purpose**: Establish reusable normalization and a strictly typed compact response before entity queries or UI work.

- [X] T004 [P] Write failing NFKC, alef, diacritic, tatweel, alif-maqsura, whitespace, and normalized-empty tests in `backend/tests/test_search_normalization.py`
- [X] T005 Implement input normalization, SQL normalization expressions, and safe LIKE-pattern escaping in `backend/app/services/search_normalization.py`
- [X] T006 [P] Write failing response validation and point/bounds invariant tests in `backend/tests/test_search_service.py`
- [X] T007 Define SearchEntityType, coordinates, bounds, compact result, and response schemas in `backend/app/schemas/search.py` and export them from `backend/app/schemas/__init__.py`
- [X] T008 [P] Define strict Frontend SearchResult, SearchResponse, and MapFocusRequest contracts in `frontend/src/features/search/types.ts` and `frontend/src/features/map/types.ts`

**Checkpoint**: Query normalization and the cross-stack compact result contract are explicit without changing historical storage.

---

## Phase 3: User Story 1 — Find a Historical Entity in Arabic (Priority: P1) 🎯 MVP

**Goal**: Return globally ranked, public Event/Person/Place/State matches and show them in a compact Arabic result list.

**Independent Test**: Query exact Event, canonical Person, shared Person alias, Place, State, normalized Arabic, prefix, partial, no-match, and limit cases; verify stable ranking and no private/orphan leakage.

### Tests for User Story 1

- [X] T009 [P] [US1] Write failing SQL compilation, match-tier, stable-order, public-eligibility, no-duplicate, and result-projection tests in `backend/tests/test_search_service.py`
- [X] T010 [P] [US1] Write failing endpoint validation, compact response, empty-result, and bounded-limit tests in `backend/tests/test_search_api.py`
- [X] T011 [P] [US1] Write failing live PostgreSQL tests for each entity type, alias ambiguity, Arabic normalization, prefix/partial ranking, private/orphan exclusion, coordinates/bounds, deterministic context, and global limit in `backend/tests/test_search_integration.py`
- [X] T012 [P] [US1] Write failing Arabic URL encoding, AbortSignal, response-guard, entity-type, coordinate, bounds, and invalid-payload tests in `frontend/src/features/search/api/search-client.test.ts`
- [X] T013 [P] [US1] Write failing typing, loading, results, entity-label/context, empty, and failure-state tests in `frontend/src/features/search/components/search-command.test.tsx`

### Implementation for User Story 1

- [X] T014 [US1] Implement the four ranked SQLAlchemy entity projections, deterministic published Event/Boundary navigation contexts, global `UNION ALL` ordering, PostGIS point/bounds projection, and compact serialization in `backend/app/services/search.py`
- [X] T015 [US1] Add the validated public route in `backend/app/api/v1/search.py` and register it in `backend/app/main.py`
- [X] T016 [US1] Implement strict result validation, Arabic query encoding, cancellation, and bounded request behavior in `frontend/src/features/search/api/search-client.ts`
- [X] T017 [US1] Implement the Arabic RTL debounced SearchCommand with result type/context labels and loading, empty, and failure states in `frontend/src/features/search/components/search-command.tsx`

**Checkpoint**: Search is independently usable as a public Arabic discovery surface and never returns unqualified records.

---

## Phase 4: User Story 2 — Navigate Results through Time and Space (Priority: P1)

**Goal**: Route each result through the existing selected Hijri year, Timeline response, map focus, and correct existing selection experience.

**Independent Test**: Select one result of each type and prove the declared year loads before focus/selection, Event/Person open the declared Event context, Place/State do not fabricate drawers, and no geometry produces no camera movement.

### Tests for User Story 2

- [X] T018 [P] [US2] Write failing search-navigation year-clamping and playback-stop reducer tests in `frontend/src/features/timeline/state/timeline-state.test.ts`
- [X] T019 [P] [US2] Extend MapLibre tests for point `flyTo`, Boundary `fitBounds`, pre-load queueing, repeated request ids, no-focus stability, unchanged visibility, and one Map instance in `frontend/src/features/map/components/historical-map.test.tsx`
- [X] T020 [P] [US2] Extend workspace tests for pending-year ordering, mapped/unmapped Event selection, Person Event context, Place point-only selection, State Boundary framing, no synthetic focus, and drawer-type rules in `frontend/src/features/map/components/map-workspace.test.tsx`

### Implementation for User Story 2

- [X] T021 [US2] Add an atomic search-navigation Timeline action that sets the central Hijri year and stops playback in `frontend/src/features/timeline/state/timeline-state.ts`
- [X] T022 [US2] Add request-id-keyed point/bounds focus effects and load queueing without rebuilding MapLibre in `frontend/src/features/map/components/historical-map.tsx`
- [X] T023 [US2] Separate Event drawer target from marker id, add matching-year pending navigation, apply point/bounds focus, preserve no-geometry camera, and expose simple Place/State selection context in `frontend/src/features/map/components/map-workspace.tsx`
- [X] T024 [US2] Wire SearchCommand selection into MapWorkspace and keep Event/Boundary layer visibility untouched in `frontend/src/features/map/components/map-workspace.tsx`

**Checkpoint**: Search result selection follows result → selectedYear → Timeline API → map update → focus/selection with no alternate year store or map recreation.

---

## Phase 5: User Story 3 — Keyboard and Failure-Resilient Search (Priority: P2)

**Goal**: Complete accessible keyboard operation, stale-response protection, focus management, and search-only failure isolation.

**Independent Test**: Operate search entirely with the keyboard, dismiss it without state changes, supersede a request, close a search-opened drawer back to the input, and simulate search failure while the map/timeline remain usable.

### Tests for User Story 3

- [X] T025 [P] [US3] Extend SearchCommand tests for combobox/listbox semantics, ArrowDown/ArrowUp wrapping, Enter, Escape, active descendant, stale-response cancellation, trimmed/minimum input, and focus behavior in `frontend/src/features/search/components/search-command.test.tsx`
- [X] T026 [P] [US3] Extend workspace tests for search failure isolation, Escape/no-selection stability, drawer focus return, rapid selection races, and layer-toggle persistence in `frontend/src/features/map/components/map-workspace.test.tsx`

### Implementation for User Story 3

- [X] T027 [US3] Complete keyboard navigation, accessible active option, sequence-token stale-result protection, and imperative input focus in `frontend/src/features/search/components/search-command.tsx`
- [X] T028 [US3] Restore focus after a search-opened Event drawer closes and announce successful/no-location navigation without changing existing state in `frontend/src/features/map/components/map-workspace.tsx`

**Checkpoint**: Search is keyboard-operable, race-safe, and cannot break or silently replace the existing historical experience.

---

## Phase 6: Polish and Cross-Cutting Verification

**Purpose**: Prove M-03 against live PostgreSQL and a real browser, document actual behavior, and stop before M-04.

- [X] T029 Run the complete Backend pytest suite and Ruff from `backend/`, including live M-03 PostgreSQL/PostGIS integration
- [X] T030 Run Frontend Vitest, ESLint, and production build from `frontend/`
- [X] T031 Verify live `/api/v1/health` and `/api/v1/search` for `بغداد`, `أبو مسلم`, `الزاب`, `المنصور`, and `الخلافة العباسية`, plus validation, no-match, and limit cases
- [X] T032 Perform the real-browser RTL, keyboard, entity navigation, map movement/no-movement, Event drawer, State Boundary framing, layer persistence, zoom/pan, and Console review in `specs/005-historical-search/quickstart.md`
- [X] T033 Re-run `$speckit-analyze`-equivalent acceptance traceability, verify `docs/18_ACCEPTANCE_CRITERIA.md` M-03 criteria and DEC-014 regressions, and inspect the diff for credentials or M-04/later scope
- [X] T034 Mark every completed item in `specs/005-historical-search/tasks.md`, verify a clean intended diff, create one `feat: implement M-03 historical search` commit, push to `origin/main`, and confirm clean `git status`

---

## Dependencies and Execution Order

- Phase 1 records policy and scope before implementation.
- Phase 2 blocks every user story by defining normalization and the compact cross-stack contract.
- US1 delivers searchable public results and is the independent MVP.
- US2 consumes the US1 result contract and existing Timeline/Map state; it does not modify search ranking.
- US3 hardens the US1 control and US2 navigation without adding entity profiles or new state stores.
- Cross-cutting verification follows all stories.

## Parallel Opportunities

- T004, T006, and T008 touch separate normalization, Backend contract, and Frontend contract surfaces.
- T009–T013 are separate Backend SQL/API/integration and Frontend client/component test files.
- T018–T020 cover reducer, MapLibre, and workspace behavior independently.
- T025 and T026 cover control and integration behavior separately.
- Backend regression and Frontend regression may run concurrently after implementation.

## Implementation Strategy

1. Freeze normalization/public eligibility and the result contract first.
2. Prove PostgreSQL filtering/ranking and public navigation context before exposing the endpoint.
3. Prove the Frontend client/control independently before wiring navigation.
4. Resolve the existing drawer-versus-marker coupling, then apply pending navigation only after the target year loads.
5. Complete keyboard/race/focus behavior, run live verification, audit M-03 scope, and stop before M-04.
