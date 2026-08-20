# Quickstart Validation: First Interactive Historical Event (F-05)

1. Apply database migrations, then run the documented seed module twice. The second run must not create a duplicate event.
2. Request `GET /api/v1/events/founding-of-baghdad`; verify the response matches [event detail contract](contracts/event-detail.md), contains source metadata, and reports 145 AH / 762 CE.
3. Request timeline state for 145 AH and verify one Baghdad event feature; request 146 AH and verify that it is absent.
4. Run backend tests and frontend tests/lint/build.
5. Start backend and frontend. At 145 AH, select Baghdad’s marker: verify an RTL drawer with the source section and focused close button. Change to 146 AH: verify drawer closes. Force the detail request to fail and verify retryable Arabic feedback.
