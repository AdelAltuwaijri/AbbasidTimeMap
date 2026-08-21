# Tasks: Historical Event Experience

**Input**: Design documents from `/specs/006-event-experience/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/event-detail.openapi.yaml`

**Tests**: Backend, frontend, live API, browser, accessibility, responsive, regression, lint, and production-build checks are required by the feature specification.

## Phase 1: Setup and Baseline

**Purpose**: Fix the package boundary and preserve a reproducible starting point.

- [x] T001 Record starting SHA `7ed250cb9a5aade0447f574a060cdf160a5300dc` and M-04 scope in `specs/006-event-experience/spec.md`
- [x] T002 [P] Audit existing event/date/relationship/source models and publication behavior in `backend/app/models/historical.py`, `backend/app/services/events.py`, and `backend/tests/test_events_api.py`
- [x] T003 [P] Audit existing event drawer, M-03 navigation, selected-marker lifecycle, and frontend tests in `frontend/src/features/events/` and `frontend/src/features/map/components/map-workspace.tsx`
- [x] T004 [P] Audit the live 132–170 AH corpus for uncertainty, optional narratives, relationships, sources, and representative manual examples
- [x] T005 Complete Specification, Clarify, Plan, and design artifacts under `specs/006-event-experience/`

---

## Phase 2: Foundational Public Contract

**Purpose**: Define the shared additive contract and privacy/publication boundaries before story implementation.

**⚠️ CRITICAL**: User-story implementation starts only after these decisions are stable.

- [x] T006 Confirm no schema migration or dependency change is required and record the decision in `specs/006-event-experience/research.md`
- [x] T007 Define structured dates, related entities, distinct citations, and 404 behavior in `specs/006-event-experience/contracts/event-detail.openapi.yaml`
- [x] T008 Classify `HistoricalEvent.editorial_notes` and `Source.notes` as private-by-default and `EventSource.reliability_note` as the only currently eligible public reliability note in `specs/006-event-experience/research.md`
- [x] T009 Run a non-destructive cross-artifact analysis over `spec.md`, `plan.md`, `research.md`, `data-model.md`, contract, and `tasks.md`, resolving all critical/high inconsistencies before code changes

**Checkpoint**: M-04 contract, privacy, navigation, and package boundary are fixed.

---

## Phase 3: User Story 1 — Complete, Trustworthy Event Account (Priority: P1) 🎯 MVP

**Goal**: A published event exposes and displays all curated public detail, uncertainty, and provenance without invented or private content.

**Independent Test**: Request/render fixtures for exact, year-only, approximate/circa, ranged, disputed, multi-source, and sparse events; every stored public value appears once and every absent/private field stays absent.

### Tests for User Story 1

- [x] T010 [P] [US1] Add failing backend projection/API tests for structured start/end dates, causes, consequences, summary English, primary/related places, typed people/states, enriched sources, deterministic ordering, and optional values in `backend/tests/test_events_api.py`
- [x] T011 [P] [US1] Add failing backend tests for Gregorian plain-label fallback, valid http(s) URL filtering, source deduplication, and exclusion of `editorial_notes`/`Source.notes` in `backend/tests/test_events_api.py`
- [x] T012 [P] [US1] Add live PostgreSQL tests proving published+source-proven+confidence access and 404 for unknown, draft, reviewed, archived, unsourced, and confidence-unclassified events in `backend/tests/test_events_integration.py`
- [x] T013 [P] [US1] Add failing strict frontend contract tests for full event payloads, structured date metadata, relationship arrays, source metadata, and malformed payload rejection in `frontend/src/features/events/api/event-client.test.ts`
- [x] T014 [P] [US1] Add failing drawer tests for all conditional narrative/date/place/source/confidence sections, exact/year/approximate/circa/range/disputed wording, Bidi-safe metadata, safe links, and no placeholders in `frontend/src/features/events/components/event-drawer.test.tsx`

### Implementation for User Story 1

- [x] T015 [US1] Extend additive public schemas for structured dates, narratives, typed relationships, and enriched sources in `backend/app/schemas/events.py`
- [x] T016 [US1] Implement published/source-proven/confidence-classified deterministic projection, related-place filtering, source URL sanitization/deduplication, and Gregorian fallback in `backend/app/services/events.py`
- [x] T017 [US1] Extend strict event types and runtime payload validation in `frontend/src/features/events/types.ts` and `frontend/src/features/events/api/event-client.ts`
- [x] T018 [US1] Implement the Arabic semantic Event Experience sections, confidence guidance, neutral disputed notice, related-place display, and rich source cards in `frontend/src/features/events/components/event-drawer.tsx`
- [x] T019 [US1] Verify User Story 1 with targeted backend/frontend tests and live responses for `founding-of-baghdad`, `death-of-marwan-ii`, `al-muqanna-revolt`, `death-of-al-hadi`, and `harun-campaign-to-bosporus`

**Checkpoint**: A public event account is complete, sourced, uncertainty-aware, and independently testable.

---

## Phase 4: User Story 2 — Related Historical Context (Priority: P1)

**Goal**: Related people and states reuse the M-03 temporal/map navigation and the same event drawer without profiles or modern geography.

**Independent Test**: Select a related Person and State from an event; the declared M-03 result controls shared year/focus, Person opens its declared event in the same drawer, State frames historical bounds, and missing geometry stays missing.

### Tests for User Story 2

- [x] T020 [P] [US2] Add failing drawer interaction tests for related Person/State controls, absence of raw relationship machine codes, disabled/loading state, and navigation failure announcement in `frontend/src/features/events/components/event-drawer.test.tsx`
- [x] T021 [P] [US2] Add failing workspace tests for exact related-entity resolution, Person-to-declared-event replacement, State historical-boundary focus, missing geometry, stale navigation response isolation, and stable current detail on failure in `frontend/src/features/map/components/map-workspace.test.tsx`
- [x] T022 [P] [US2] Extend search-entry regression tests proving marker, Event search, and Person search render the same full event contract in `frontend/src/features/map/components/map-workspace-search.test.tsx`

### Implementation for User Story 2

- [x] T023 [US2] Add accessible related Person/State actions and navigation status callbacks to `frontend/src/features/events/components/event-drawer.tsx`
- [x] T024 [US2] Resolve exact related entities through the existing M-03 search client and reuse `selectSearchResult` in `frontend/src/features/map/components/map-workspace.tsx`
- [x] T025 [US2] Preserve marker highlighting, shared Timeline sequencing, historical boundary focus, and no-synthetic-geometry behavior during related navigation in `frontend/src/features/map/components/map-workspace.tsx`
- [x] T026 [US2] Verify related navigation manually from a multi-person/multi-state event while auditing DEC-014 and confirming no profile route or modern political layer was introduced

**Checkpoint**: Person and State relationships continue through the established historical context without expanding the product model.

---

## Phase 5: User Story 3 — Accessible, Responsive Event Reading (Priority: P2)

**Goal**: The richer event surface is keyboard-accessible, scrollable, responsive, stable, and avoids duplicate detail requests.

**Independent Test**: At desktop/tablet/mobile widths, open, traverse, replace, close, and reopen an event using keyboard and pointer; focus, year, marker, camera, layers, errors, and request counts remain correct.

### Tests for User Story 3

- [x] T027 [P] [US3] Add failing drawer accessibility tests for dialog semantics, semantic headings, initial focus, Tab/Shift+Tab containment, Escape, close, and responsive scroll/surface classes in `frontend/src/features/events/components/event-drawer.test.tsx`
- [x] T028 [P] [US3] Add failing workspace tests for successful-detail cache hits, uncached retry, A→B stale response isolation, content replacement, initiator focus restoration, close stability, and inactive-year closure in `frontend/src/features/map/components/map-workspace.test.tsx`
- [x] T029 [P] [US3] Add/retain selected-marker regression tests through open, replacement, close, and year invalidation in `frontend/src/features/map/components/historical-map.test.tsx`

### Implementation for User Story 3

- [x] T030 [US3] Implement semantic focus lifecycle, Escape, keyboard containment, sticky close header, internal scrolling, and mobile bottom-sheet/tablet-desktop drawer behavior in `frontend/src/features/events/components/event-drawer.tsx`
- [x] T031 [US3] Implement successful-response session cache plus abort/sequence-safe loading in `frontend/src/features/map/components/map-workspace.tsx`
- [x] T032 [US3] Preserve map operability, current year, camera, layers, marker lifecycle, and stable failure behavior across Event Experience transitions
- [x] T033 [US3] Verify keyboard, 1280px desktop, 768px tablet, and 390px mobile behavior in a real browser with no horizontal clipping or inaccessible close/source controls

**Checkpoint**: All three stories are independently functional and integrated.

---

## Phase 6: Regression, Documentation, and Delivery

**Purpose**: Close M-04 with complete automated/live/manual evidence and no M-05 work.

- [x] T034 [P] Run the complete Backend pytest suite, live M-04 PostgreSQL tests, and Ruff from `backend/`
- [x] T035 [P] Run the complete Frontend Vitest suite, ESLint, and Next.js production build from `frontend/`
- [x] T036 Verify live API output and privacy for representative exact, ranged, approximate/circa, disputed, multi-source, sparse, political, battle, revolt, death, and accession events
- [x] T037 Complete real-browser marker/search/related navigation, zoom/pan, Drawer, responsive, focus, cache/network, ≤1 second uncached local detail timing, and Console checks using `proclamation-of-al-saffah`, `battle-of-the-great-zab`, `al-muqanna-revolt`, `death-of-al-hadi`, `accession-of-al-mansur`, plus Search→Event/Person/State
- [x] T038 [P] Update `docs/09_API_SPEC.md`, `docs/05_INFORMATION_ARCHITECTURE_UX.md`, `docs/20_UI_DESIGN_SYSTEM.md`, and `docs/21_DECISIONS_LOG.md` only where the delivered M-04 contract/decisions require it
- [x] T039 Re-run Spec Kit convergence/acceptance review against `docs/18_ACCEPTANCE_CRITERIA.md`, confirm no M-05 scope and no credential leakage, then mark only objectively completed tasks
- [x] T040 Create one commit `feat: implement M-04 event experience`, push it to `origin/main`, and verify clean `git status`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup and Baseline (Phase 1)**: Complete.
- **Foundational Contract (Phase 2)**: Depends on Phase 1 and blocks code changes.
- **User Story 1 (Phase 3)**: Depends on Phase 2 and establishes the shared API/drawer contract.
- **User Story 2 (Phase 4)**: Depends on the US1 drawer contract and existing M-03 search navigation.
- **User Story 3 (Phase 5)**: Can test focus/cache in parallel, but final integration depends on the US1 drawer and workspace changes.
- **Regression/Delivery (Phase 6)**: Depends on all user stories.

### Parallel Opportunities

- Backend US1 tests/implementation can proceed in parallel with frontend failing tests.
- Drawer contract tests, workspace navigation tests, and historical-map regressions touch distinct test files.
- Backend full verification and frontend full verification can run in parallel after implementation.
- Documentation review can run alongside final automated suites once the delivered contract is stable.

## Implementation Strategy

Deliver the additive public projection and conditional read-only drawer first. Then
connect only the existing M-03 Person/State navigation, followed by focus/cache and
responsive hardening. Do not add corpus facts merely to populate empty sections,
do not expose internal notes, do not define an undocumented previous/next order,
and stop before M-05.

## Phase 7: Convergence

- [x] T041 Align generated FastAPI OpenAPI constraints and documented 404 behavior with `contracts/event-detail.openapi.yaml`, and add a generated-schema regression test per FR-017 (partial)
- [x] T042 Preserve the open Event and surface a related-navigation error when Timeline loading fails after exact Person/State resolution, including retry-safe pending-state cleanup and a regression test per FR-032 (partial)
- [x] T043 Recover keyboard focus inside the open Drawer when retry replaces its focused error action with loading content, and add a regression test per FR-028 / SC-006 (partial)
- [x] T044 Clarify in `docs/09_API_SPEC.md` that public source notes are limited to event-specific `reliability_note` and never general `Source.notes` per FR-016 (partial)
