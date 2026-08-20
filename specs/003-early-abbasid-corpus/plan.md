# Implementation Plan: Early Abbasid Seed Corpus

**Branch**: `main` | **Date**: 2026-08-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-early-abbasid-corpus/spec.md`

## Summary

Deliver a curated 132–170 AH corpus as reviewable UTF-8 JSON datasets plus a Pydantic validation and SQLAlchemy import pipeline. The importer validates the complete graph before writing, upserts canonical entities and relationships idempotently in one transaction, preserves F-05's `founding-of-baghdad`, and produces a deterministic manifest. The existing timeline and map APIs remain unchanged: annual temporal intersection returns all active events while GeoJSON contains only records with valid geometry. No political boundary data or base-map labels are introduced.

## Technical Context

**Language/Version**: Python 3.11+ backend; TypeScript 5 / React 19 frontend regression surface

**Primary Dependencies**: Pydantic 2, SQLAlchemy 2, GeoAlchemy2, FastAPI, psycopg 3; existing Next.js 16 and MapLibre 5 regression surface

**Storage**: PostgreSQL 17 with PostGIS for imported records; version-controlled UTF-8 JSON under `data/seed/m01/` as the seed source of record

**Testing**: pytest for corpus validation/import/API integration; Vitest, ESLint, and Next.js production build for regression verification

**Target Platform**: Local and deployed web application environments using the existing backend/frontend layout

**Project Type**: Monorepo web application with an explicit offline seed/import command

**Performance Goals**: Validate and import the target corpus in under 30 seconds on the local development database; representative annual timeline queries remain comfortably interactive at this corpus size

**Constraints**: Every published event is source-backed; uncertainty is explicit; import is atomic and idempotent; no silent skipping; no fabricated coordinate precision; no schema change unless proven necessary; no M-02 boundaries; DEC-014 remains enforced

**Scale/Scope**: 30–50 events, 10–20 people, 10–20 places, necessary states, reusable sources and event types for 132–170 AH

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **Arabic-first historical experience**: PASS. Arabic titles, summaries, display labels, place names, and canonical person names are required; Hijri years drive queries.
- **Source-proven record**: PASS. Full-graph validation rejects published events without sources and records event-specific citation locators.
- **Temporal and spatial fidelity**: PASS. Precision is preserved in date objects; geometry is optional and approximate points require disclosure.
- **Approved stack and schema discipline**: PASS. The plan uses the existing FastAPI/SQLAlchemy/PostgreSQL/PostGIS stack. Inspection found no schema change necessary, so no migration is planned.
- **Simple, scoped delivery**: PASS. Work is limited to data files, importer/validator, manifest, tests, and decision-oriented documentation. M-02 and later features are excluded.
- **DEC-014**: PASS. No provider labels or political boundaries enter seed data; application-owned places and labels are canonical records, and `political_boundaries` remains untouched.

## Project Structure

### Documentation (this feature)

```text
specs/003-early-abbasid-corpus/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── corpus-import.md
└── tasks.md
```

### Source Code (repository root)

```text
data/seed/m01/
├── event_types.json
├── sources.json
├── people.json
├── places.json
├── states.json
├── events.json
└── manifest.json

backend/app/seeds/
├── corpus_schema.py
├── corpus_loader.py
└── early_abbasid_corpus.py

backend/tests/
├── test_corpus_validation.py
├── test_corpus_import.py
└── test_m01_timeline.py
```

**Structure Decision**: Keep historical content in `data/seed/m01/` so reviewers can inspect it without reading Python. Keep validation, loading, persistence, and command behavior in the existing backend seed package. Reuse existing models and public API services without frontend or schema changes.

## Complexity Tracking

No constitution violations or additional architectural layers require justification.

## Post-Design Constitution Re-check

The data model, import contract, and quickstart retain all pre-design gates. The design performs complete validation before database mutation, reuses canonical entities, omits unsupported geometry, leaves `political_boundaries` untouched, and treats the physical base map only as external geography reference governed by DEC-014.
