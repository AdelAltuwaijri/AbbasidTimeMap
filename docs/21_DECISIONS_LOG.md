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

## DEC-013 — Optional event-person role key
**Decision:** `event_people.role_code` is stored as an empty string when no role is specified.

**Reason:** The documented composite primary key includes `role_code`, and PostgreSQL primary-key columns cannot be NULL. The empty value preserves an optional role without weakening uniqueness.

## DEC-014 — Historically neutral base map
**Decision:** Modern political labels and boundaries must never be part of the base map; historical labels and boundaries are application-controlled temporal layers.

**Reason:** The base map is a geography reference only. It may show natural land, water, rivers, and terrain, but provider-controlled modern country, administrative, city, road, and POI information would misrepresent the selected historical period. Events, political boundaries, places, and labels therefore remain separate historical data layers owned by Abbasid TimeMap.

## DEC-015 — Reviewed corpus files and atomic import
**Decision:** M-01 historical seed content is stored as normalized UTF-8 JSON under `data/seed/m01/`, validated as one complete relationship graph, and imported atomically by stable canonical keys. A deterministic committed manifest must match the validated files.

**Reason:** Separating Arabic historical content from Python makes citations and relationships reviewable, while validation before persistence rejects unsourced publication, temporal inversions, invalid geometry, unknown types, orphaned relationships, duplicate slugs, and manifest drift. Idempotent canonical upserts preserve F-05 identity and allow the corpus to expand without duplicate entities.

**Source strategy:** The scholarly SUNY translation of al-Ṭabarī volumes 27–30 is the chronological near-classical backbone. Modern synthesis and confidence judgments are cross-checked with Hugh Kennedy's *The Early Abbasid Caliphate* and focused Encyclopaedia Iranica articles or academic monographs. AI output is not a source.

**Scope note:** M-01 creates application-owned historical place labels and relationships but no political boundary geometry. The physical base map remains governed by DEC-014; M-02 remains responsible for sourced temporal boundary reconstruction.

## DEC-016 — Sourced temporal political-control envelopes
**Decision:** Historical political boundaries are application-owned, source-linked WGS84 MultiPolygon records with inclusive Hijri validity intervals. M-02 uses three evidence-triggered periods—132–143, 144–154, and 155–170 AH—with `confidence_level=medium` and `spatial_precision=approximate`. Geometry is a conservative, low-vertex control envelope between historical and physical-geography anchors; it must never trace modern political or administrative borders.

**Reason:** Eighth-century evidence describes governors, garrisons, taxation, cities, routes, and regional campaigns rather than surveyed frontier lines. Separating historical confidence from spatial precision exposes that epistemic limit. Raids, intermittent tribute, diplomatic contact, or nominal claims do not alone justify inclusion, and a change of caliph does not trigger new geometry without a sourced territorial or administrative change.

**Publication rule:** Every published boundary requires direct provenance, explicit inclusion/exclusion methodology and limitations, valid non-empty SRID 4326 MultiPolygon geometry, and non-overlapping same-state validity unless a reviewed overlap is explicitly justified. Atlas outlines may be used only for macro cross-checking and must not be digitized as evidence. Geometry is rejected rather than silently auto-repaired.

**DEC-014 relationship:** The base map remains physical reference only. Political geometry, historical places, and labels are temporal Abbasid TimeMap layers; no modern boundary or label source participates in the reconstruction.

## DEC-017 — Public historical search projections
**Decision:** M-03 searches Event, Person, Place, and State names/titles through bounded query-time PostgreSQL projections. It adds no search table, stored normalized column, extension, external index, semantic search, or numeric year result type.

**Normalization:** Matching applies Unicode NFKC and lowercasing, removes invisible format controls, Arabic diacritics, and tatweel, maps `أ/إ/آ/ٱ` to `ا` and `ى` to `ي`, and trims/collapses whitespace. It does not conflate `ة` with `ه` or rewrite `ؤ/ئ`. Curated stored text remains unchanged and is always used for display.

**Public eligibility:** Events must be published. A Person requires a published `EventPerson`; a Place requires a published `EventPlace` or primary-place relationship; a State requires a published `EventState` or published PoliticalBoundary. Search covers primary names/titles and Person aliases, not summaries, biographies, or `modern_reference` prose.

**Ranking:** Order literal primary-label exact, normalized primary-label exact, primary-label prefix, Person alias exact/prefix, primary-label partial, Person alias partial, then stable-slug match. Break ties by match position, shorter normalized primary label, entity type, relevant Hijri year, and slug.

**Navigation:** Event results use their own published date and supported point. Person context prefers a related published Event whose slug contains the Person slug, then importance, supported point, earlier year, and slug. Place context uses the highest-importance then earliest related published Event, but focus uses only the Place's own stored point or area. State prefers its earliest published Boundary by year/slug, falling back to the highest-importance then earliest related published Event; Boundary focus uses bounds, never a synthetic centroid. Selection changes DEC-012's shared Hijri year, waits for that Timeline response, then focuses/selects without rebuilding MapLibre or changing layer visibility. Only Event and Person results may open the declared existing Event drawer; no Person, Place, or State profile is invented.

**Deferred scope:** Search state remains session-local. Shareable URL parameters are deferred, and numbers are not exposed as a fifth `year` result type in M-03.

## Future decisions
Record material changes here instead of allowing implementation drift.
