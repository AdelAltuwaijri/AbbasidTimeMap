# Seed Data Plan — Early Abbasid MVP

## Corpus window
132–170 AH.

## Purpose
Seed data exists to validate the engine, not to claim corpus completeness.

## Categories to include
- establishment/consolidation events
- caliphal accessions/deaths
- major military events
- revolts
- important cities
- administrative/political changes
- early scholarly/intellectual context where well sourced

## Data priority
### Tier 1 — required
- start of Abbasid rule
- Battle of the Zab context
- first Abbasid caliphs
- move/establishment of political centers
- founding of Baghdad (145 AH)
- major succession events within window

### Tier 2 — supporting
- regional revolts
- key governors/commanders
- major infrastructure/administrative changes
- places connected to Tier 1 events

### Tier 3 — enrichment
- notable scholars alive in the period
- cultural/scientific events with reliable dating

## Seed record structure
Each event seed should include:
- stable slug
- Arabic title
- event type
- Hijri date/range
- Gregorian display equivalent if available
- summary
- cause/impact when supported
- location
- people/states
- confidence
- sources

## Ingestion format
Use structured JSON/YAML/CSV import fixtures rather than hard-coded SQL wherever practical.

## Editorial workflow
1. gather source
2. create draft fact record
3. verify date/location
4. classify confidence
5. import
6. review in application/admin tooling later

## Rule
If a source is not available, keep record as a development fixture or omit it from published seed data.
