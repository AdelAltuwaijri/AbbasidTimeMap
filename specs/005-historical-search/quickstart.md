# Quickstart: Historical Search Verification

## Prerequisites

- Local PostgreSQL/PostGIS database contains the imported M-01 corpus and M-02 boundaries.
- `backend/.env` points to that local database; credentials remain untracked.
- Backend dependencies and Frontend dependencies are installed.

## Automated Backend checks

From `backend/`:

```powershell
python -m pytest
python -m ruff check app tests
```

Expected: normalization, API contract, ranking, public eligibility, navigation metadata, integration, and all existing historical tests pass.

## Automated Frontend checks

From `frontend/`:

```powershell
npm test
npm run lint
npm run build
```

Expected: the search client/control, keyboard behavior, Timeline navigation, MapLibre focus, drawer flow, layer-preservation tests, lint, TypeScript, and production build pass.

## Run the application

Backend from `backend/`:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend from `frontend/`:

```powershell
npm run dev
```

## API review

Verify the health and search contract:

```text
GET http://127.0.0.1:8000/api/v1/health
GET http://127.0.0.1:8000/api/v1/search?q=بغداد
GET http://127.0.0.1:8000/api/v1/search?q=أبو%20مسلم
GET http://127.0.0.1:8000/api/v1/search?q=الزاب
GET http://127.0.0.1:8000/api/v1/search?q=المنصور
GET http://127.0.0.1:8000/api/v1/search?q=الخلافة%20العباسية
```

Also verify:

- `q` missing, one visible character, diacritics/tatweel only, and over 100 visible normalized characters return `422`.
- `limit=1` returns at most one result and `limit=21` returns `422`.
- A valid no-match query returns `200` with an empty result list.
- No draft/reviewed/archived Event or orphan entity appears.

## Real-browser review

Open `http://localhost:3000` in a real browser and verify:

1. The search label and input are Arabic RTL and visually legible over the map.
2. For each required query—`بغداد`, `أبو مسلم`, `الزاب`, `المنصور`, `الخلافة العباسية`—inspect the entity label and factual context.
3. Use ArrowDown/ArrowUp and Enter without a pointer; use Escape to dismiss results.
4. Select `تأسيس بغداد`: year becomes 145 AH, Baghdad marker is selected/focused, and the existing Event drawer opens.
5. Select `بغداد` as a Place: year becomes the declared related Event year, the map focuses `[44.3661, 33.3152]`, and no Event drawer is fabricated.
6. Select `أبو مسلم الخراساني`: the declared related Event/year is used and that existing Event drawer opens.
7. Select `نهر الزاب الكبير`: year becomes 132 AH, no synthetic map point is created, and the camera remains stable.
8. Select `الخلافة العباسية`: year becomes 132 AH and the first published historical Boundary is framed without a State profile.
9. Hide Events or Boundaries, repeat search navigation, and verify each toggle stays unchanged.
10. Simulate a search failure and verify the Timeline and map continue to work.
11. Confirm zoom/pan, Timeline controls, Boundary disclosure, marker click/close, RTL/Bidi, and historically neutral base map still work.
12. Inspect the Browser Console for impactful errors and confirm only one MapLibre map remains mounted.

## Scope audit

Confirm the diff contains no M-04 Event Experience, profiles, journeys, AI/semantic/vector search, administration, modern base-map labels/boundaries, credentials, or URL-state expansion.
