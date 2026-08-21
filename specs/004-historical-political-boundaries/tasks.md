# Tasks: Historical Political Boundaries

**Input**: Design documents from `/specs/004-historical-political-boundaries/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by the specification. Test tasks precede corresponding implementation tasks.

## Phase 1: Setup and Governance

**Purpose**: Establish M-02 package boundaries and record the approved historical/cartographic decisions.

- [X] T001 Verify repository ignore rules and create `data/boundaries/m02/` plus dedicated boundary seed module paths under `backend/app/seeds/`
- [X] T002 Record direct boundary provenance, publication filtering, confidence/precision separation, and DEC-014 scope in `docs/21_DECISIONS_LOG.md`
- [X] T003 Add the lightweight reconstruction methodology document and documentation index entry in `docs/22_POLITICAL_BOUNDARY_RECONSTRUCTION.md` and `docs/00_README.md`

---

## Phase 2: Foundational Schema and Validation

**Purpose**: Add auditable boundary storage and strict offline geometry validation before importing historical data.

- [X] T004 [P] Write failing ORM, publication, association, and migration assertions in `backend/tests/test_boundary_model.py`
- [X] T005 [P] Write failing field, range, geometry, source, state, duplicate, overlap, and manifest-drift tests in `backend/tests/test_boundary_validation.py`
- [X] T006 Add Shapely 2 geometry validation dependency to `backend/requirements.txt`
- [X] T007 Implement PoliticalBoundary identity/publication/precision/methodology fields and BoundarySource relationships in `backend/app/models/historical.py` and `backend/app/models/__init__.py`
- [X] T008 Add Alembic migration for boundary provenance, publication, constraints, and indexes in `backend/alembic/versions/*_add_boundary_provenance.py`
- [X] T009 Extend publication validation for sourced, ordered, valid PoliticalBoundary records in `backend/app/services/publication.py`
- [X] T010 Implement strict M-02 schemas, Shapely validation, overlap rules, package loading, and deterministic manifest generation in `backend/app/seeds/boundary_schema.py` and `backend/app/seeds/boundary_loader.py`

**Checkpoint**: Invalid or unsourced boundary packages fail before persistence, and the schema can audit each published reconstruction.

---

## Phase 3: User Story 1 — See Political Extent Change with Time (Priority: P1)

**Goal**: Import three defensible, visibly distinct Abbasid reconstructions and select the correct one for each Hijri year.

**Independent Test**: Validate/import the package and query endpoint years 132/143, 144/154, and 155/170 plus an uncovered year; the selected slug changes only at 144 and 155.

### Tests for User Story 1

- [X] T011 [P] [US1] Write failing exact count, period, state, confidence/precision, vertex, and exclusion manifest tests in `backend/tests/test_boundary_manifest.py`
- [X] T012 [P] [US1] Write failing atomic import, idempotency, canonical State/Source reuse, PostGIS validity, and rollback tests in `backend/tests/test_boundary_import.py`

### Implementation for User Story 1

- [X] T013 [P] [US1] Add reviewed scholarly source records and exact citation metadata in `data/boundaries/m02/sources.json`
- [X] T014 [US1] Add the 132–143, 144–154, and 155–170 simplified WGS84 MultiPolygons with anchors, exclusions, notes, and source links in `data/boundaries/m02/boundaries.geojson`
- [X] T015 [US1] Generate and commit the deterministic M-02 summary in `data/boundaries/m02/manifest.json`
- [X] T016 [US1] Implement atomic canonical upsert, HistoricalDate reuse, source reconciliation, publication validation, and count reporting in `backend/app/seeds/boundary_importer.py`
- [X] T017 [US1] Add `--validate-only`, `--manifest`, and import modes in `backend/app/seeds/historical_boundaries.py`

**Checkpoint**: Two imports preserve three boundary UUIDs and source links, all geometries pass Shapely/PostGIS, and M-01 data remains canonical.

---

## Phase 4: User Story 2 — Understand Evidence and Uncertainty (Priority: P2)

**Goal**: Return only valid published reconstructions with typed state, temporal, uncertainty, and compact provenance properties.

**Independent Test**: Request representative years and inspect each GeoJSON feature for state id/slug/name, inclusive validity, medium confidence, approximate precision, source count/primary source, and Arabic warning.

### Tests for User Story 2

- [X] T018 [P] [US2] Replace empty geometry fixtures and add published/private, endpoint-inclusive, transition, empty-year, typed provenance, and serialization tests in `backend/tests/test_timeline_api.py`
- [X] T019 [P] [US2] Add live SQL/PostGIS representative-year integration coverage in `backend/tests/test_boundary_timeline_integration.py`

### Implementation for User Story 2

- [X] T020 [US2] Define typed BoundaryFeature geometry/properties contracts in `backend/app/schemas/timeline.py`
- [X] T021 [US2] Filter published boundaries and serialize compact provenance/uncertainty properties in `backend/app/services/timeline.py`
- [X] T022 [US2] Extend M-01 integration assertions so its importer never mutates boundaries or boundary-source links in `backend/tests/test_corpus_import.py`

**Checkpoint**: The timeline exposes exactly one Abbasid boundary for covered years, no drafts, and no citation-heavy payload.

---

## Phase 5: User Story 3 — Control the Historical Layer Independently (Priority: P3)

**Goal**: Render and disclose historical boundaries below events with a persistent independent control and no modern political base-map content.

**Independent Test**: Hide boundaries, change years, verify they stay hidden while events remain; re-enable and inspect the correct current-year reconstruction without a new MapLibre instance.

### Tests for User Story 3

- [X] T023 [P] [US3] Write failing boundary typing and runtime-response validation tests in `frontend/src/features/timeline/api/timeline-client.test.ts` and `frontend/src/features/map/types.ts`
- [X] T024 [P] [US3] Extend workspace tests for A→B geometry changes, independent toggle persistence, stale-boundary clearing, concise disclosure, and Baghdad regression in `frontend/src/features/map/components/map-workspace.test.tsx`
- [X] T025 [P] [US3] Extend MapLibre tests for layer order, setData without re-instantiation, fill/outline visibility, event priority, and DEC-014 in `frontend/src/features/map/components/historical-map.test.tsx` and `frontend/src/features/map/config/map-config.test.ts`

### Implementation for User Story 3

- [X] T026 [US3] Add explicit BoundaryFeature properties and strict timeline boundary guards in `frontend/src/features/map/types.ts`, `frontend/src/features/timeline/types.ts`, and `frontend/src/features/timeline/api/timeline-client.ts`
- [X] T027 [US3] Add persistent `layers.boundaries` state and independent reducer action in `frontend/src/features/map/state/map-ui-state.ts`
- [X] T028 [US3] Add the Arabic historical-boundary checkbox and neutral-base-map disclosure in `frontend/src/features/map/components/layer-panel.tsx`
- [X] T029 [US3] Apply visibility to both boundary layers, keep them below events, update data in place, and prioritize event clicks in `frontend/src/features/map/components/historical-map.tsx`
- [X] T030 [US3] Wire boundary visibility/data transitions, clear stale boundaries on errors, and provide concise Arabic source/uncertainty disclosure in `frontend/src/features/map/components/map-workspace.tsx` and `frontend/src/features/map/components/boundary-details.tsx`

**Checkpoint**: Boundary UI state is independent, temporal geometry changes smoothly, and event markers/drawers remain dominant.

---

## Phase 6: Polish and Cross-Cutting Verification

**Purpose**: Prove M-02 against live PostGIS and the real browser without entering M-03.

- [X] T031 Run Alembic upgrade/current and the M-02 importer twice against the project-local PostgreSQL/PostGIS database
- [X] T032 Verify database counts, stable UUIDs, source relationships, `ST_IsValid`, `ST_IsEmpty`, `ST_SRID=4326`, and non-overlapping inclusive periods
- [X] T033 Run the complete Backend pytest suite and Ruff from `backend/`
- [X] T034 Run Frontend Vitest, ESLint, and production build from `frontend/`
- [X] T035 Verify live API results for 132, 143, 144, 154, 155, 170 and an uncovered service year, plus the unchanged 145 AH Baghdad event
- [X] T036 Perform real-browser multi-period geometry, toggle persistence, event layering/drawer, zoom/pan, smooth transition, RTL, DEC-014, and console review using `specs/004-historical-political-boundaries/quickstart.md`
- [X] T037 Audit no M-03/later work or credentials entered the diff, mark completed tasks in `specs/004-historical-political-boundaries/tasks.md`, then create and push the approved commit

---

## Dependencies and Execution Order

- Phase 1 precedes schema and data implementation.
- Phase 2 blocks every user story.
- US1 creates the reviewed data and importer required by US2 and live US3 review.
- US2 defines the typed public contract consumed by US3.
- US3 changes only rendering/UI state and does not alter chronology or M-01 event behavior.
- Cross-cutting verification follows all stories.

## Parallel Opportunities

- T004 and T005 affect separate test files.
- T011, T012, and T013 can be prepared independently after schemas are designed.
- T018 and T019 cover separate API and live-integration surfaces.
- T023–T025 cover separate Frontend test surfaces.
- Backend regression and Frontend regression may run concurrently after implementation.

## Implementation Strategy

1. Protect publication, provenance, temporal order, overlap, and geometry validity first.
2. Commit reviewable GeoJSON only after its manifest and exclusions reconcile.
3. Prove idempotent PostGIS persistence before exposing boundaries publicly.
4. Strengthen the typed timeline contract before wiring UI controls.
5. Verify DEC-014 and M-01 regressions in a real browser, then stop before M-03.
