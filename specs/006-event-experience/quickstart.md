# M-04 Verification Quickstart

Run from `C:\Projects\AbbasidTimeMap` with the existing local PostgreSQL/PostGIS
database configured in ignored `backend/.env`.

## Backend

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
```

Probe a published detail and a missing detail after starting Uvicorn:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/events/founding-of-baghdad
Invoke-WebRequest http://127.0.0.1:8000/api/v1/events/not-a-real-event -SkipHttpErrorCheck
```

Verify that structured dates, relationship roles, and distinct sources are present
where stored, and that neither `editorial_notes` nor source `notes` occurs in the
JSON. Run the live event integration tests against the local test database.

## Frontend

```powershell
Set-Location ..\frontend
npm test
npm run lint
npm run build
```

## Browser acceptance

Start Backend and Frontend, then inspect at 1280×800, 768×900, and 390×844:

1. Select 145 AH and open the Baghdad marker.
2. Confirm title, uncertainty-aware date, place/type, summary, importance,
   confidence explanation, relationships, and distinct sources.
3. Verify optional causes/consequences are absent when the stored values are empty.
4. Open `proclamation-of-al-saffah`, `battle-of-the-great-zab`,
   `al-muqanna-revolt`, `death-of-al-hadi`, and `accession-of-al-mansur` to cover
   political, battle, revolt, death/accession, approximate/circa/range, and
   disputed records.
5. Navigate a related Person and State; confirm the M-03 year/map sequence and
   historical state bounds, with no modern boundary or synthesized coordinate.
6. Repeat through Event search and Person search; confirm the same drawer. Select
   the State result for «الخلافة العباسية» and confirm it frames only its published
   historical boundary context without opening a profile.
7. Use Tab/Shift+Tab, Escape, close, scrolling, zoom, and pan; verify focus return,
   marker highlight, unchanged layer choices, and closure when changing to an
   inactive year.
8. Measure one uncached local detail request and confirm the detail is readable in
   at most one second under normal local conditions. Reopen it and verify only one
   detail request in the network log.
9. Confirm no impactful browser-console errors.

Do not begin M-05 during this verification.
