# Feature Specification: F-04 Timeline Engine

**Feature Branch**: `main`  
**Created**: 2026-08-20  
**Status**: Ready for implementation  
**Input**: Implement F-04 Timeline Engine.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore one Hijri year (Priority: P1)

As a visitor, I can select a Hijri year and see the published historical state for that year on the map.

**Why this priority**: The selected Hijri year is the central product interaction and the prerequisite for time-aware exploration.

**Independent Test**: Select a year and verify that only active mapped events and valid political boundaries returned for that year are displayed without a page reload.

**Acceptance Scenarios**:

1. **Given** the map is open, **When** the visitor chooses a valid Hijri year, **Then** the visible year changes and the map receives the historical state for that year.
2. **Given** a published event spans multiple Hijri years, **When** a year inside that span is selected, **Then** the event is included in that year's state.
3. **Given** no event or boundary applies to a valid year, **When** it is selected, **Then** the visitor receives a valid empty state rather than invented history.

---

### User Story 2 - Navigate time predictably (Priority: P2)

As a visitor, I can move to the previous or next Hijri year, choose a year with the selector, and play or pause sequential playback.

**Why this priority**: It makes historical comparison fluid while keeping Hijri chronology primary.

**Independent Test**: Start playback within the configured range, observe one-year increments, pause it, and verify it stops at the upper bound.

**Acceptance Scenarios**:

1. **Given** a selected year in the configured range, **When** the visitor selects previous or next, **Then** it moves one valid year without leaving the range.
2. **Given** playback is running, **When** the visitor pauses, **Then** no further year changes occur.
3. **Given** playback reaches the upper configured year, **When** the next interval occurs, **Then** playback stops and the year remains at that upper bound.

---

### User Story 3 - Preserve map context while changing time (Priority: P3)

As a visitor, I retain my layer preference and do not retain a selection for an event that is no longer active in the newly selected year.

**Why this priority**: Time navigation must not unexpectedly alter display choices or present invalid context.

**Independent Test**: Hide events, change year, and verify the event layer stays hidden; select an event then change to a year outside its range and verify selection clears.

**Acceptance Scenarios**:

1. **Given** the events layer is hidden, **When** the year changes, **Then** it stays hidden while its source data updates.
2. **Given** an event is selected, **When** the next state excludes it, **Then** its selection is removed cleanly.

### Edge Cases

- Events with exact day/month, approximate, or disputed Hijri dates remain eligible for their recorded Hijri year at annual granularity.
- Events without usable geometry are included as summaries but omitted from map GeoJSON without failing the state response.
- Open-ended events remain active from their Hijri start year onward.
- A boundary lacking a valid record for the selected year returns no boundary; no modern substitute geometry is used.
- A failed year request preserves the last successful map state and leaves the timeline operable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a public, validated historical state for a selected Hijri year containing metadata, active event summaries, mapped event GeoJSON, and valid political boundaries.
- **FR-002**: The system MUST treat a published event as active when its Hijri date range intersects the selected Hijri year, including same-year, ranged, open-ended, exact, approximate, and disputed dates.
- **FR-003**: The system MUST return only political boundaries whose Hijri validity range contains the selected year.
- **FR-004**: The interface MUST display and change one shared selected Hijri year through previous, next, direct selection, play, and pause controls.
- **FR-005**: Changing the selected year MUST update map sources without a full-page reload or replacement of the map instance.
- **FR-006**: Playback MUST advance deterministically by one year, stop at the configured upper bound, and maintain at most one active timer.
- **FR-007**: Layer visibility preferences MUST be independent of temporal data changes.
- **FR-008**: A selected event MUST be cleared when it is absent from the new year's active events.
- **FR-009**: The interface MUST provide localized, non-blocking loading and error feedback while preserving the last successful state on request failure.
- **FR-010**: Timeline controls and Hijri-year labels MUST preserve Arabic RTL and Bidi behavior.

### Key Entities

- **Timeline state**: The historical snapshot derived for one selected Hijri year.
- **Active event**: A published event whose Hijri date range intersects the selected year; it may have a map feature or only a summary.
- **Political boundary**: A source-backed state geometry valid for the selected Hijri year.
- **Timeline UI state**: The shared selected year and playback status used by controls and map updates.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can change the visible Hijri year through each supplied control and see the corresponding state without a full page reload.
- **SC-002**: Automated checks demonstrate inclusion for same-year and overlapping events, exclusion for inactive events, and an intact empty-year response.
- **SC-003**: Automated checks demonstrate that only boundaries valid for the selected year are returned.
- **SC-004**: Automated interface checks demonstrate deterministic playback, pause, upper-bound stopping, retained layer visibility, and invalid-selection cleanup.

## Assumptions

- The initial selectable range is a UI configuration, not a claim about corpus completeness, and can be changed when curated corpus limits become available.
- F-04 introduces temporal query behavior only and does not seed historical records or build the F-05 detail drawer.
- Gregorian display metadata is optional and is not used to determine annual Hijri activity.
