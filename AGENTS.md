# AGENTS.md — Codex Instructions

You are implementing **Abbasid TimeMap**.

## Read first
- `docs/00_README.md`
- relevant roadmap/architecture documents for the package you are assigned

## Core constraints
- Use Next.js + TypeScript frontend.
- Use FastAPI backend.
- Use PostgreSQL + PostGIS.
- Use MapLibre GL JS for interactive map.
- Hijri chronology is primary.
- Preserve Arabic RTL and correct Bidi for English/code/numbers.
- Do not hard-code historical content into UI.
- Do not invent historical facts.
- AI output is never a historical source of record.
- Published historical records require source provenance.
- Every schema change requires Alembic migration.
- Work package-by-package from `docs/16_ROADMAP_AND_MILESTONES.md`.
- Verify against `docs/18_ACCEPTANCE_CRITERIA.md` before declaring a package complete.

## Execution style
- inspect before changing
- implement minimum complete package scope
- avoid unrelated refactors
- run tests/lint/build
- report exact changed files and results
- stop if architecture/scope decision is required
