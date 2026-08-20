# Quickstart: Verify M-01 Seed Corpus

## Prerequisites

- PostgreSQL/PostGIS configured through local `backend/.env`
- Backend virtual environment and frontend dependencies installed

## Validate without writing

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.seeds.early_abbasid_corpus --validate-only --manifest
```

Expected: `valid` status, target counts, and a manifest matching `data/seed/m01/manifest.json`.

Expected corpus counts:

- 42 events
- 20 people
- 20 places
- 4 states or political movements
- 16 sources
- 11 event types

The count target is met. Cultural/scientific enrichment is intentionally limited to one well-dated scholarly event; no scientific milestone was added merely to fill a category or year.

## Migrate and import twice

```powershell
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m app.seeds.early_abbasid_corpus
.\.venv\Scripts\python.exe -m app.seeds.early_abbasid_corpus
```

Expected: identical counts and no duplicate canonical rows or relationships.

## Automated verification

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\ruff.exe check .

cd ..\frontend
npm test
npm run lint
npm run build
```

## Representative API years

Verify `/api/v1/timeline/state?year_hijri=` for 132, 136, 145, 158, and 170. Each response must match expected active events; only spatial events appear in `event_features`.

## Manual browser path

1. Select several years and confirm marker counts change.
2. Select 145 AH, click Baghdad, and verify the F-05 drawer and source.
3. Confirm non-spatial events remain in timeline data without markers.
4. Confirm the physical base map has no provider labels or modern boundaries and the console has no impactful errors.

## Scope audit

Confirm `political_boundaries` received no M-01 rows and no M-02, search, journey, AI, world-context, person-agent, or admin feature was added.

## Source and validation review

The chronological backbone is the scholarly SUNY translation of al-Ṭabarī, volumes 27–30. Modern cross-checks include Hugh Kennedy's *The Early Abbasid Caliphate*, Encyclopaedia Iranica articles on the Abbasid caliphate, Abū Muslim, Khurasan, Baghdad, al-Muqannaʿ, Herat, the Barmakids, Hārūn al-Rashīd, Jaʿfar al-Ṣādiq, and Chinese-Iranian relations, plus Amikam Elad's monograph on the 145 AH Hasanid rebellion.

Validation rejects:

- duplicate event/entity slugs or source keys
- unknown event types
- missing person, place, state, or source targets
- published events without sources
- end years before start years or dates outside 132–170 AH
- invalid coordinate shape/ranges and mapped records without uncertainty notes
- malformed declared HTTP(S) URLs
- primary places absent from event-place relationships
- committed manifest drift

Approximate or disputed dates remain explicitly marked. Regional records without defensible point geometry remain available to the timeline but absent from marker GeoJSON.
