# Quickstart: Verify M-02 Historical Political Boundaries

## 1. Validate reviewed files

From `backend/`:

```powershell
.\.venv\Scripts\python.exe -m app.seeds.historical_boundaries --validate-only
.\.venv\Scripts\python.exe -m app.seeds.historical_boundaries --manifest
```

Expected: three records for `abbasid-caliphate`, periods `132–143`, `144–154`, `155–170`, confidence `medium`, spatial precision `approximate`, no overlap, and a matching committed manifest.

## 2. Migrate and import twice

Load the project-local `DATABASE_URL` from `backend/.env`, then run:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m app.seeds.historical_boundaries
.\.venv\Scripts\python.exe -m app.seeds.historical_boundaries
.\.venv\Scripts\python.exe -m alembic current
```

Expected: identical counts and stable identities both times; all three geometries are valid, non-empty MultiPolygons in SRID 4326, and every published record has sources.

## 3. Automated checks

```powershell
# backend/
.\.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
.\.venv\Scripts\python.exe -m ruff check .

# frontend/
npm test
npm run lint
npm run build
```

## 4. API representative years

Check `/api/v1/timeline/state` for:

| Year | Expected boundary |
|---:|---|
| 131 | empty if API range permits; otherwise validate service directly |
| 132, 143 | `abbasid-extent-132-143` |
| 144, 154 | `abbasid-extent-144-154` |
| 155, 170 | `abbasid-extent-155-170` |

Verify typed state identity, confidence, spatial precision, source count, primary-source indicator, valid geometry, and zero modern-boundary features.

## 5. Real-browser review

Run Backend and Frontend, then inspect at least 132, 144, and 155 AH:

- the extent changes at both documented transitions;
- fill stays translucent and outline readable;
- the 145 AH Baghdad marker stays above the boundary and opens its existing drawer;
- the boundary disclosure identifies the Abbasid state, period, medium confidence, approximate geometry, and source;
- hiding boundaries leaves events visible and remains hidden across a year change;
- re-enabling restores the correct current-year geometry;
- zoom/pan and timeline transitions do not recreate/reset the map;
- no modern political labels/borders appear and the console is clean.

## 6. Scope audit

Confirm M-03 search and all later features remain unchanged and `git diff` contains no credentials or modern boundary dataset.
