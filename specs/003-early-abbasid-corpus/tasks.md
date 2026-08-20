# Tasks: Early Abbasid Seed Corpus

**Input**: Design documents from `/specs/003-early-abbasid-corpus/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required by the feature specification. Test tasks precede their implementation tasks.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the reviewable seed package and protect repository conventions.

- [X] T001 Verify ignore rules and create the M-01 data package paths in `data/seed/m01/` and backend seed module paths in `backend/app/seeds/`
- [X] T002 Record the M-01 source/import and DEC-014 governance decisions in `docs/21_DECISIONS_LOG.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement strict file and graph validation before any historical records can be persisted.

- [X] T003 [P] Write failing field, duplicate, source, range, geometry, event-type, relationship, and manifest-drift tests in `backend/tests/test_corpus_validation.py`
- [X] T004 Implement strict seed entity schemas and field validation in `backend/app/seeds/corpus_schema.py`
- [X] T005 Implement UTF-8 package loading, graph validation, deterministic manifest generation, and explicit errors in `backend/app/seeds/corpus_loader.py`

**Checkpoint**: Invalid corpus records fail before a database transaction begins.

---

## Phase 3: User Story 1 - Explore a Documented Early Abbasid Timeline (Priority: P1)

**Goal**: Populate 132–170 AH with a diverse, source-backed event corpus visible through the existing annual timeline and spatial marker behavior.

**Independent Test**: Validate/import the package and verify expected active events for 132, 136, 145, 158, and 170 AH, with only geolocated events in `event_features`.

### Tests for User Story 1

- [X] T006 [P] [US1] Write failing corpus count, yearly distribution, type distribution, and F-05 manifest tests in `backend/tests/test_m01_manifest.py`
- [X] T007 [P] [US1] Write failing representative-year and spatial/non-spatial timeline tests in `backend/tests/test_m01_timeline.py`

### Implementation for User Story 1

- [X] T008 [P] [US1] Add reusable event types to `data/seed/m01/event_types.json`
- [X] T009 [P] [US1] Add canonical scholarly and academic sources to `data/seed/m01/sources.json`
- [X] T010 [P] [US1] Add canonical people to `data/seed/m01/people.json`
- [X] T011 [P] [US1] Add canonical application-owned places with uncertainty notes to `data/seed/m01/places.json`
- [X] T012 [P] [US1] Add necessary states and movements without boundary geometry to `data/seed/m01/states.json`
- [X] T013 [US1] Add 30–50 reviewed, relationship-rich events for 132–170 AH to `data/seed/m01/events.json`
- [X] T014 [US1] Generate and commit the exact deterministic summary in `data/seed/m01/manifest.json`

**Checkpoint**: The package validates and its event/year/type counts reconcile exactly.

---

## Phase 4: User Story 2 - Inspect Provenance and Historical Relationships (Priority: P2)

**Goal**: Persist canonical sources, people, places, states, dates, and event relationships without duplication while preserving F-05.

**Independent Test**: Import twice and verify canonical entity UUID/count reuse, event-specific source locators, all published events source-backed, and unchanged founding-of-Baghdad behavior.

### Tests for User Story 2

- [X] T015 [P] [US2] Write failing idempotency, canonical reuse, relationship, source, rollback, and F-05 compatibility tests in `backend/tests/test_corpus_import.py`

### Implementation for User Story 2

- [X] T016 [US2] Implement atomic canonical upserts, historical-date reuse, relationship reconciliation, publication checks, and count reporting in `backend/app/seeds/corpus_importer.py`
- [X] T017 [US2] Add the explicit `--validate-only`/`--manifest` import command in `backend/app/seeds/early_abbasid_corpus.py`
- [X] T018 [US2] Verify the existing focused seed converges with the M-01 corpus without changing the F-05 slug or public detail in `backend/app/seeds/founding_of_baghdad.py`

**Checkpoint**: Two imports produce identical counts and canonical identities.

---

## Phase 5: User Story 3 - Reproduce and Audit the Corpus Import (Priority: P3)

**Goal**: Make validation, import, manifest review, and failure behavior reproducible for maintainers.

**Independent Test**: Run the documented command in validate-only and import modes, compare manifests, exercise invalid fixtures, and confirm atomic rollback.

### Tests and implementation for User Story 3

- [X] T019 [US3] Add CLI success/error contract coverage to `backend/tests/test_corpus_command.py`
- [X] T020 [US3] Document source strategy, file format, validation rules, count deviations, and review commands in `specs/003-early-abbasid-corpus/quickstart.md` and `docs/21_DECISIONS_LOG.md`

**Checkpoint**: A maintainer can validate and reproduce M-01 from a clean migrated database.

---

## Phase 6: Polish & Cross-Cutting Verification

**Purpose**: Validate the complete package without entering M-02.

- [X] T021 Run Alembic current/upgrade and the M-01 importer twice against local PostgreSQL/PostGIS using `backend/.env`
- [X] T022 Run all backend pytest and Ruff checks from `backend/`
- [X] T023 Run frontend Vitest, ESLint, and production build from `frontend/`
- [X] T024 Verify API outputs for 132, 136, 145, 158, and 170 AH plus F-05 event detail against `specs/003-early-abbasid-corpus/quickstart.md`
- [X] T025 Perform real-browser multi-year marker, Baghdad drawer, RTL, DEC-014 base-map, and console review using `specs/003-early-abbasid-corpus/quickstart.md`
- [X] T026 Audit that `political_boundaries` and later-milestone feature areas were not populated or implemented, then mark all completed tasks in `specs/003-early-abbasid-corpus/tasks.md`

---

## Dependencies & Execution Order

- Phase 1 precedes all implementation.
- Phase 2 blocks corpus data and persistence work.
- US1 establishes the validated source package.
- US2 depends on the validated US1 package and adds database persistence.
- US3 depends on the loader/importer contract and completes auditability.
- Cross-cutting verification follows all stories.

## Parallel Opportunities

- T003 can be prepared independently of T002 after paths are known.
- T006 and T007 can be written in parallel.
- T008–T012 affect separate data files and can be reviewed in parallel before T013 links them.
- T015 can be written while static manifest tests are being completed.
- Backend and frontend regression suites may run concurrently after import verification.

## Implementation Strategy

1. Protect historical quality first with failing validation tests.
2. Build and validate the reviewable corpus before database mutation.
3. Add atomic idempotent import and prove canonical reuse.
4. Verify public timeline/map behavior and F-05 regression.
5. Stop before M-02 and push only after all automated and manual checks pass.
