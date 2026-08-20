# Implementation Plan: F-04 Timeline Engine

**Branch**: `main` | **Date**: 2026-08-20 | **Spec**: [spec.md](spec.md)

## Summary

Make the selected Hijri year the sole temporal state for the map workspace. A FastAPI timeline service derives published event summaries, map GeoJSON, and valid political boundaries from the existing historical-date model. A focused client timeline feature owns selected year and playback state; MapLibre source updates render changed features without recreating the map.

## Technical Context

**Language/Version**: Python 3.11; TypeScript 5 / React 19 / Next.js 16

**Primary Dependencies**: FastAPI, SQLAlchemy, GeoAlchemy2, Pydantic; Next.js, MapLibre GL JS, Vitest, Testing Library

**Storage**: PostgreSQL + PostGIS using F-02 tables; no schema changes

**Testing**: pytest + FastAPI TestClient; Vitest + Testing Library

**Target Platform**: Browser client and HTTP API

**Project Type**: Web application (Next.js frontend + FastAPI backend)

**Performance Goals**: Year changes update only map sources and show responsive feedback; the map instance persists across temporal changes.

**Constraints**: Hijri chronology is authoritative; no fabricated corpus or fallback boundary geometry; public responses are published records only; Arabic RTL/Bidi is preserved; F-05 is excluded.

**Scale/Scope**: One timeline state endpoint, one client timeline feature, map synchronization, and targeted backend/frontend tests.

## Constitution Check

**Pre-design gate: PASS.** Arabic-first controls preserve RTL/Bidi; no content is seeded; temporal filters remain Hijri-first; FastAPI, Next.js/TypeScript, PostGIS, and MapLibre remain in use; F-02 schema supports the work without a migration; F-05 scope is excluded.

**Post-design gate: PASS.** Service/schema/route and timeline/state/component separation preserves all constitution principles.

## Project Structure

```text
specs/001-timeline-engine/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md, tasks.md
└── contracts/timeline-state.md

backend/app/{api/v1/timeline.py,schemas/timeline.py,services/timeline.py}
backend/tests/test_timeline_api.py
frontend/src/features/timeline/{api,components,state}/
frontend/src/features/map/{api,components,state}/
```

**Structure Decision**: The existing web-application layout remains intact. The backend service owns SQL and GeoJSON assembly; its schema and route expose the contract. The client timeline feature owns time state and controls. `MapWorkspace` composes both features, and `HistoricalMap` keeps responsibility for incremental MapLibre updates.
