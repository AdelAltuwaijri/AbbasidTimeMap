# Implementation Plan: Historical Political Boundaries

**Branch**: `main` | **Date**: 2026-08-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-historical-political-boundaries/spec.md`

## Summary

Create three reviewed, source-linked Abbasid political-extent reconstructions for 132–143, 144–154, and 155–170 AH. Store simplified WGS84 MultiPolygons and their uncertainty/provenance in PostGIS through a dedicated validating, atomic, idempotent import pipeline. Extend the annual timeline GeoJSON with typed compact provenance, keep draft records private, and complete the existing MapLibre boundary layers with an independent persistent toggle and concise Arabic reconstruction disclosure. DEC-014 remains unchanged: NASA physical imagery is only geographic context and contributes no political lines or labels.

## Technical Context

**Language/Version**: Python 3.11 backend; TypeScript/React with Next.js 16 frontend

**Primary Dependencies**: FastAPI, SQLAlchemy 2, GeoAlchemy2, Alembic, Pydantic 2, Shapely 2, MapLibre GL JS

**Storage**: PostgreSQL/PostGIS; reviewed UTF-8 GeoJSON and JSON under `data/boundaries/m02/`

**Testing**: pytest with optional live PostGIS integration, Ruff, Vitest/Testing Library, ESLint, Next.js production build, real-browser review

**Target Platform**: Local web application and standards-compliant desktop browser

**Project Type**: Monorepo web application with REST API

**Performance Goals**: Three low-vertex reconstructions serialize to compact GeoJSON and switch interactively without recreating the map; representative timeline calls remain comfortably sub-second locally

**Constraints**: Hijri-first inclusive validity; WGS84 only; no automatic geometry repair; no modern administrative data; event markers above boundaries; source-backed publication only; M-03 remains untouched

**Scale/Scope**: One historical state, three boundary records, a small number of scholarly sources, 132–170 AH

## Constitution Check

*GATE: Passed before Phase 0 and re-checked after Phase 1.*

- **Arabic-first**: Arabic state names, reconstruction warning, controls, and Bidi-safe source metadata remain primary.
- **Source-proven record**: Each published reconstruction has explicit many-to-many source provenance and citation locators.
- **Temporal/spatial fidelity**: Evidence confidence and spatial precision are separate; the geometry is explicitly approximate and inclusive validity is documented.
- **Approved stack/schema discipline**: Existing FastAPI/PostGIS/MapLibre structure is reused and all schema changes ship through Alembic.
- **Simple scoped delivery**: One State with three defensible temporal boundary records; no annual interpolation, modern boundaries, political label system, search, admin UI, or M-03 work.
- **Post-design result**: PASS. The design adds only the source relationship and publication/uncertainty fields needed for auditability and public filtering.

## Historical Reconstruction Decision

| Record | Validity | Supported change | Confidence / precision |
|---|---:|---|---|
| `abbasid-extent-132-143` | 132–143 AH | Founding/consolidation envelope; excludes unstable Ifrīqiya and independent Caspian highlands | medium / approximate |
| `abbasid-extent-144-154` | 144–154 AH | Adds only the defensible lowlands of Ṭabaristān after the conquest of 144/761 | medium / approximate |
| `abbasid-extent-155-170` | 155–170 AH | Adds the stable Tripoli–Qayrawān/Ifrīqiya corridor after the campaign of 155/772 | medium / approximate |

The geometry is a low-vertex editorial control envelope anchored to historical regions, cities, routes, coasts, rivers, and mountain exclusions. Raids, tribute, embassies, and nominal claims are not treated as territorial incorporation. Academic atlas maps are macro cross-checks, never traced as surveyed frontiers.

## Data and Schema Design

- Add stable `slug`, `publication_status`, and `spatial_precision` to `political_boundaries`.
- Retain `notes` for a short Arabic reconstruction disclosure; add `methodology_notes` and `limitations_notes` for auditable reasoning.
- Add `boundary_sources` with citation locator, support type, and reliability note.
- Add confidence/publication/precision and PostGIS validity/non-empty/SRID checks plus `state_id` and stable identity indexes.
- Enforce historical-date order and same-state temporal overlap in the package validator/importer because dates live behind foreign keys.
- Filter the public timeline to `published` boundaries only.
- Use typed GeoJSON properties including state identity, validity, confidence, spatial precision, source count, primary-source title/URL, and concise warning.

## Project Structure

### Documentation (this feature)

```text
specs/004-historical-political-boundaries/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── political-boundaries.md
└── tasks.md
```

### Source Code (repository root)

```text
data/boundaries/m02/
├── boundaries.geojson
├── sources.json
└── manifest.json

backend/
├── alembic/versions/*_add_boundary_provenance.py
├── app/models/historical.py
├── app/schemas/timeline.py
├── app/services/{publication,timeline}.py
├── app/seeds/
│   ├── boundary_schema.py
│   ├── boundary_loader.py
│   ├── boundary_importer.py
│   └── historical_boundaries.py
└── tests/
    ├── test_boundary_validation.py
    ├── test_boundary_import.py
    ├── test_boundary_manifest.py
    └── test_timeline_api.py

frontend/src/features/map/
├── components/{historical-map,layer-panel,map-workspace,boundary-details}.tsx
├── state/map-ui-state.ts
└── types.ts

frontend/src/features/timeline/api/timeline-client.ts
docs/22_POLITICAL_BOUNDARY_RECONSTRUCTION.md
```

**Structure Decision**: Extend the existing monorepo and historical-layer pipeline. M-02 receives a dedicated data/import boundary so M-01 remains independently reproducible and continues to prove it never creates boundaries.

## Complexity Tracking

No constitutional violations or unapproved architectural complexity.
