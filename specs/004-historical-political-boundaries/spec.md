# Feature Specification: Historical Political Boundaries

**Feature Branch**: `main`

**Created**: 2026-08-21

**Status**: Draft

**Input**: M-02 — add sourced, time-varying reconstructions of early Abbasid political extent for 132–170 AH while preserving DEC-014 and the M-01 timeline/event experience.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Political Extent Change with Time (Priority: P1)

An Arabic-speaking historical explorer changes the selected Hijri year and sees the applicable reconstruction of Abbasid political extent change beneath the event markers without reloading the map.

**Why this priority**: Time-aware political geography is the defining value of M-02 and must work independently of later search, journey, or editorial features.

**Independent Test**: Select representative years from each documented validity period and verify that the correct distinct extent appears, while a year without an applicable record produces no boundary.

**Acceptance Scenarios**:

1. **Given** at least three sourced reconstruction periods, **When** the selected year moves between those periods, **Then** the visible shape changes to the valid record for the new year.
2. **Given** a selected year outside all reconstructed periods, **When** the historical world is requested, **Then** the boundary collection is empty rather than substituting a modern or guessed boundary.
3. **Given** active events and a valid boundary, **When** the map renders, **Then** event markers remain visible and interactive above the translucent boundary.

---

### User Story 2 - Understand Evidence and Uncertainty (Priority: P2)

A researcher can identify the historical state, covered period, confidence level, source provenance, and reconstruction limitations for every displayed extent.

**Why this priority**: A reconstructed zone of political influence must never be presented as a precise modern international border or as an unsupported fact.

**Independent Test**: Inspect every published boundary record and confirm that it has traceable sources, explicit confidence, temporal validity, and notes explaining methodology and limitations.

**Acceptance Scenarios**:

1. **Given** a published reconstruction, **When** its public metadata is inspected, **Then** the state name, Hijri period, confidence, provenance indicator, and approximation warning are available.
2. **Given** evidence that only supports broad control, **When** geometry is recorded, **Then** its notes describe it as an approximate zone rather than an exact border.
3. **Given** conflicting or inadequate evidence for an area, **When** the record is curated, **Then** uncertainty is represented explicitly or the unsupported area is excluded.

---

### User Story 3 - Control the Historical Layer Independently (Priority: P3)

An explorer can hide or show historical political boundaries independently of events, and that visibility choice persists while the year changes.

**Why this priority**: Independent controls preserve map readability and reinforce the separation between the neutral geographic reference and application-owned historical data.

**Independent Test**: Hide boundaries, change years repeatedly, and verify that boundaries remain hidden while events and timeline state continue normally; then re-enable them without reloading the map.

**Acceptance Scenarios**:

1. **Given** both events and boundaries are visible, **When** the boundary control is disabled, **Then** only boundaries disappear.
2. **Given** boundaries are disabled, **When** the year changes, **Then** the visibility choice remains disabled.
3. **Given** the control is re-enabled, **When** a valid year is selected, **Then** the correct historical reconstruction appears below events.

### Edge Cases

- A validity range with its end before its start is rejected.
- Empty, malformed, self-intersecting, or non-WGS84 geometry is rejected before publication.
- Two records for the same state may not overlap temporally unless the overlap is explicitly declared and justified as intentional.
- A published boundary without a state or source provenance is rejected.
- A valid year with no reconstruction returns an empty collection and a usable map.
- Multiple states valid in the same year remain distinct features with their own provenance.
- Geometry updates preserve the current camera and layer visibility state.
- A boundary source failure never causes modern political borders or labels to appear.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide more than one temporally distinct political-boundary record for 132–170 AH and MUST show a real geometry change between documented periods.
- **FR-002**: Each boundary MUST reference one canonical historical state.
- **FR-003**: Each boundary MUST have inclusive Hijri validity bounds, geometry, confidence, reconstruction notes, and at least one traceable scholarly source.
- **FR-004**: Published boundaries without provenance MUST be rejected.
- **FR-005**: Boundary geometry MUST use WGS84 and MUST be a non-empty valid polygon or multipolygon.
- **FR-006**: Geometry creation MUST be reproducible from reviewed, application-owned data files.
- **FR-007**: Reconstruction geometry MUST describe defensible political control or influence and MUST NOT trace modern national or administrative boundaries as a substitute.
- **FR-008**: The system MUST preserve source-specific citation location and support notes where available.
- **FR-009**: The system MUST explicitly preserve approximate or disputed spatial and temporal interpretation without inventing precision.
- **FR-010**: A boundary is active only when the selected Hijri year falls inclusively within its validity range.
- **FR-011**: A year without an applicable record MUST return no political boundary.
- **FR-012**: Unintentional temporal overlap for the same state MUST be rejected; any intentional overlap MUST carry an explicit justification.
- **FR-013**: The annual historical-world response MUST include the state identifier and slug, Arabic state name, validity years, confidence, and a compact provenance indicator for each boundary.
- **FR-014**: Full source citation data SHOULD remain available without unnecessarily duplicating large citation payloads in every map feature.
- **FR-015**: Boundary geometry MUST render as a translucent fill with a clear outline below event markers.
- **FR-016**: Changing the year MUST replace boundary data without recreating the interactive map or resetting its camera.
- **FR-017**: Users MUST be able to toggle historical political boundaries independently of event markers.
- **FR-018**: Boundary visibility state MUST persist across year changes.
- **FR-019**: The neutral base map MUST contain no modern political labels, modern political borders, roads, places, or external historical labels.
- **FR-020**: Any map-visible political name MUST originate from a temporally valid application-owned historical state.
- **FR-021**: Users MUST be able to access a concise approximation warning and boundary provenance without introducing an encyclopedic interface.
- **FR-022**: Existing M-01 events, the 145 AH Baghdad marker and drawer, timeline controls, zoom/pan, RTL behavior, and attribution MUST continue to work.
- **FR-023**: Browser-facing geometry SHOULD be kept compact enough for smooth annual transitions while preserving the reviewed reconstruction meaning.
- **FR-024**: The methodology, source-selection policy, uncertainty meanings, limitations, and update process MUST be documented.
- **FR-025**: M-03 search and all later roadmap features MUST remain out of scope.

### Key Entities

- **Political Boundary**: A time-bounded, sourced reconstruction of a historical state's approximate political extent, including geometry, confidence, notes, publication state, and provenance relationships.
- **Historical State**: The canonical political entity represented by one or more non-overlapping boundary records over time.
- **Boundary Source Link**: The auditable relationship between a reconstruction and a scholarly source, including citation location, support type, and reliability or methodology note.
- **Historical Date**: The Hijri-first temporal reference used for inclusive validity bounds while preserving uncertainty.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least three documented validity periods within 132–170 AH can be selected and produce visibly distinct reconstruction shapes.
- **SC-002**: 100% of published boundary records have a state, valid geometry, confidence, reconstruction notes, and at least one source.
- **SC-003**: Representative-year checks select the correct record at both validity endpoints and return no record outside all covered periods.
- **SC-004**: Users can hide boundaries, change years, and restore them without affecting events or losing their visibility choice.
- **SC-005**: Event markers remain fully visible and clickable above every reconstruction in the representative-year review.
- **SC-006**: No modern country names, administrative names, roads, political borders, or provider-owned historical labels appear on the base map during review.
- **SC-007**: Year-to-year boundary transitions, zoom, and pan complete without a full-page reload or an impactful browser-console error.
- **SC-008**: All validation, regression, lint, and production-build checks pass before delivery.

## Assumptions

- M-02 prioritizes a small, defensible Abbasid extent sequence rather than exhaustive annual or multi-state reconstruction.
- Broad political control is represented as a deliberately simplified zone, not a surveyed frontier line.
- Source evidence may justify excluding uncertain frontier regions rather than enlarging geometry for visual completeness.
- Existing historical states and sources from M-01 are reused canonically where appropriate.
- Detailed reconstruction editing and administration remain future work; M-02 imports reviewed files reproducibly.
- The existing historically neutral physical imagery remains the geographic reference layer governed by DEC-014.
