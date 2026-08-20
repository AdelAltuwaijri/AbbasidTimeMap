# F-04 Validation Quickstart

1. Run `ruff check .` and `pytest` from `backend`.
2. Run `npm run test`, `npm run lint`, and `npm run build` from `frontend`.
3. Open the home page, choose a Hijri year, and observe `GET /api/v1/timeline/state?year_hijri=…`.
4. Use previous, next, selector, play, and pause; verify play stops at range end and layer visibility remains unchanged.
5. Confirm a request error preserves rendered data and shows localized feedback.
