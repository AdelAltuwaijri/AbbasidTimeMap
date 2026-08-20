# Feature Specification: First Interactive Historical Event (F-05)

**Feature Branch**: `main`  
**Created**: 2026-08-20  
**Status**: Ready for planning  
**Input**: Deliver one real, sourced Abbasid event end-to-end: stored data, timeline visibility, mapped marker, and an accessible Arabic detail drawer.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Explore the founding of Baghdad (Priority: P1)

As a visitor viewing 145 AH, I can see the sourced event marker for the founding of Baghdad and select it to read its historical details and provenance.

**Why this priority**: This is the smallest complete proof that the historical engine connects curated evidence, Hijri time, geography, and an understandable user experience.

**Independent Test**: Select 145 AH, activate the Baghdad marker, and verify the visible details and source without relying on any other corpus record.

**Acceptance Scenarios**:

1. **Given** the timeline is set to 145 AH, **When** the map data loads, **Then** one marker for the founding of Baghdad is visible at its stored place.
2. **Given** the marker is visible, **When** the visitor selects it, **Then** a right-to-left event drawer opens with title, Hijri date, place, category, summary, confidence, and historical source.
3. **Given** the drawer is open, **When** the visitor closes it, **Then** the selected marker and drawer close while the selected Hijri year remains 145 AH.

---

### User Story 2 - Keep event selection synchronized with time (Priority: P2)

As a visitor, I can change the selected Hijri year after opening the event and the application clears the event selection when that event is no longer active.

**Why this priority**: A historical marker must never appear valid outside its documented temporal range.

**Independent Test**: Open the event at 145 AH, move to 146 AH, and confirm that both the marker and drawer are absent.

**Acceptance Scenarios**:

1. **Given** the event drawer is open in 145 AH, **When** the visitor changes the year to 146 AH, **Then** the drawer closes cleanly and the marker is no longer selected or rendered.

---

### User Story 3 - Receive a safe detail failure state (Priority: P3)

As a visitor, I receive a clear Arabic error message if event details cannot be retrieved, while the map and timeline remain usable.

**Why this priority**: Data-detail failure must not leave a selected marker that falsely appears to have loaded evidence.

**Independent Test**: Simulate an event-detail request failure after marker selection and verify a visible retryable error state.

**Acceptance Scenarios**:

1. **Given** a visible event marker, **When** its detail request fails, **Then** the drawer shows an Arabic failure state and offers a retry action without changing the selected year.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- An unknown event slug returns a not-found response and never leaks draft or unpublished data.
- A year outside the event's 145 AH range returns no event in timeline state and clears an open drawer.
- A published event cannot be seeded or exposed without at least one source relationship.
- Mixed Arabic, English, and numeric date/source content preserves readable bidirectional text.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The curated database MUST contain exactly the minimum connected records needed to publish the founding of Baghdad in 145 AH: historical date, event type, historical event, place, source, event-source relation, and necessary person/state relations.
- **FR-002**: The published event MUST have documented source metadata sufficient to show its title, author where available, publication information, URL where available, and a truthful citation locator or note.
- **FR-003**: The event must be visible only for its documented Hijri year in timeline queries and map GeoJSON, and be absent for 146 AH.
- **FR-004**: Public event detail lookup by slug MUST return title, date display, Hijri year/range, documented Gregorian reference, type, summary, importance, original confidence value, primary place, related people/states, and sources; an unknown slug MUST return 404.
- **FR-005**: Selecting a visible marker MUST highlight it, optionally focus the map, and open an Arabic right-to-left drawer without recreating the map.
- **FR-006**: The drawer MUST show title, date, place, category, historical summary, user-readable confidence, and a clearly labelled historical-sources section with valid source links where stored.
- **FR-007**: Closing the drawer MUST preserve the selected year; changing to an inactive year MUST clear selection and close the drawer.
- **FR-008**: The drawer's close control MUST have an Arabic accessible name, be keyboard-operable, and receive focus when the drawer opens.
- **FR-009**: Detail request failures MUST be visible in Arabic and support retry without altering selected year or rebuilding the map.
- **FR-010**: Seed execution MUST be repeatable without duplicate event records and MUST not run automatically during application startup.

### Key Entities *(include if feature involves data)*

- **Historical event**: The published founding-of-Baghdad record, connected to date, category, place, people, state, and source evidence.
- **Source citation**: The scholarly reference and its event-specific locator/support note that establishes provenance.
- **Event detail**: The public, evidence-preserving view of the published event for a selected marker.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: A visitor can complete the marker-to-sourced-detail journey for the one published event in no more than two interactions after choosing 145 AH.
- **SC-002**: Timeline results contain the event for 145 AH and contain zero copies of it for 146 AH in automated tests.
- **SC-003**: Automated backend coverage verifies the event detail, source provenance, location relation, unknown-slug response, temporal filtering, and idempotent seed behavior.
- **SC-004**: Automated frontend coverage verifies drawer open/close, source/date/confidence rendering, active-year synchronization, marker selection, and detail failure state.

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- Hugh Kennedy's Encyclopaedia Iranica article is a suitable scholarly source for the recorded 145/762 foundation fact; no AI-generated source is used.
- The map point is an explicitly approximate reference point for Baghdad, rather than a claim of the precise archaeological centre of the Round City.
- The existing source relation already stores a citation locator, so no schema migration is needed solely for provenance.
- This package adds one event only and does not start the M-01 corpus, AI, search, journeys, or admin features.
