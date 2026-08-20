# Implementation Plan: First Interactive Historical Event (F-05)

**Branch**: `main` | **Date**: 2026-08-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-interactive-historical-event/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

Seed the documented founding of Baghdad (145 AH / 762 CE) and expose its published, source-backed detail by slug. Extend the existing year-query map flow so marker selection loads a focused, RTL event drawer; retain the existing MapLibre instance and clear the selection when timeline data no longer includes the event.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Python 3.11 backend; TypeScript/React 19 frontend

**Primary Dependencies**: FastAPI, SQLAlchemy, GeoAlchemy2, Alembic; Next.js 16, MapLibre GL JS, Vitest/Testing Library

**Storage**: PostgreSQL with PostGIS; a runnable idempotent seed module (not startup logic)

**Testing**: pytest, Ruff; Vitest, ESLint, Next.js production build

**Target Platform**: Browser client and local/container FastAPI service

**Project Type**: Monorepo web application

**Performance Goals**: Selecting a marker updates the drawer without reinitializing MapLibre; one-event detail interaction remains responsive on local development data.

**Constraints**: Hijri chronology primary; only published source-backed records are public; exact source claims only; Arabic RTL and Bidi correctness; no M-01 corpus or AI scope.

**Scale/Scope**: One event with the required linked records, one detail endpoint, one reusable event drawer, plus focused backend/frontend tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Historical provenance**: PASS. The seed uses Hugh Kennedy, “Baghdad i. The Iranian Connection: Before the Mongol Invasion,” *Encyclopaedia Iranica*, which documents the 145/762 foundation by al-Manṣūr; the source record and event-specific note are public.
- **No invented precision**: PASS. The date is year precision only. The map point is disclosed in editorial metadata as an approximate Baghdad reference point, not a precise archaeological claim.
- **Publication gate**: PASS. Seed attaches source before publication and tests the rule.
- **Schema/migrations**: PASS. `event_sources.citation_locator` already meets the provenance need; no schema alteration is required.
- **Architecture/scope**: PASS. API route, schema, service, seed module, UI component, and tests remain separated; M-01 and later features remain excluded.

## Project Structure

### Documentation (this feature)

```text
specs/002-interactive-historical-event/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
backend/
├── app/
│   ├── api/v1/events.py
│   ├── schemas/events.py
│   ├── services/events.py
│   └── seeds/founding_of_baghdad.py
├── tests/test_events_api.py
└── tests/test_founding_of_baghdad_seed.py

frontend/
├── src/
│   └── features/events/
│       ├── api/event-client.ts
│       └── components/event-drawer.tsx
└── src/features/map/components/map-workspace.tsx
```

**Structure Decision**: Use the existing feature-first frontend and route/schema/service backend layout. No migration is created because no schema changes are necessary.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
