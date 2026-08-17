# Decisions Log

## DEC-001 — Product form
**Decision:** Abbasid TimeMap is an interactive historical engine, not a static article site.

## DEC-002 — Primary chronology
**Decision:** Hijri chronology is primary. Gregorian equivalent is secondary/optional display.

## DEC-003 — Core stack
**Decision:** Next.js + TypeScript frontend, FastAPI backend, PostgreSQL + PostGIS database, MapLibre map rendering.

## DEC-004 — Central domain concept
**Decision:** HistoricalEvent is the primary connective entity between time, place, people, states, and sources.

## DEC-005 — Temporal uncertainty
**Decision:** Approximate, ranged, and disputed dates are explicitly modeled rather than forced into exact dates.

## DEC-006 — Spatial uncertainty
**Decision:** Events may have exact point, approximate point, region geometry, route, or no geometry.

## DEC-007 — AI truth boundary
**Decision:** AI is never the authoritative historical source. It consumes curated historical records.

## DEC-008 — AI reconstruction labeling
**Decision:** All generated visual/video reconstructions must be labeled as AI-assisted reconstructions.

## DEC-009 — MVP corpus
**Decision:** Validate the engine using 132–170 AH before attempting complete Abbasid coverage.

## DEC-010 — Repository shape
**Decision:** Monorepo with `frontend`, `backend`, `data`, and `docs`.

## DEC-011 — Public data quality
**Decision:** Published factual events require source provenance and confidence classification.

## DEC-012 — Timeline state
**Decision:** Selected historical year is a first-class global UI/domain query state.

## Future decisions
Record material changes here instead of allowing implementation drift.
