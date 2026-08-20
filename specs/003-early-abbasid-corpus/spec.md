# Feature Specification: Early Abbasid Seed Corpus

**Feature Branch**: `main`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Build the documented, interconnected M-01 seed corpus for 132–170 AH without beginning M-02 or sourcing labels or boundaries from the base map."

## User Scenarios & Testing

### User Story 1 - Explore a Documented Early Abbasid Timeline (Priority: P1)

As an Arabic-first reader, I can select years from 132 through 170 AH and see the important documented events active in each selected year, including events without map geometry.

**Why this priority**: A trustworthy and meaningfully populated timeline is the core value of M-01.

**Independent Test**: Import the corpus, query representative years including 132, 136, 145, 158, and 170 AH, and verify that each response contains only the documented events whose ranges intersect that year.

**Acceptance Scenarios**:

1. **Given** the reviewed corpus has been imported, **When** a reader selects 132 AH, **Then** the timeline returns the documented founding and transition events active in that year.
2. **Given** an event has a multi-year or uncertain range, **When** the selected year intersects that range, **Then** the event is returned without replacing its uncertainty with a fabricated exact date.
3. **Given** a published event has no reliable geometry, **When** its active year is selected, **Then** it remains present in timeline data but does not produce a map marker.

---

### User Story 2 - Inspect Provenance and Historical Relationships (Priority: P2)

As a reviewer, I can inspect each published event and trace it to reusable sources, people, places, states, and event types without duplicated canonical entities.

**Why this priority**: Source traceability and canonical relationships make the corpus auditable rather than a collection of isolated claims.

**Independent Test**: Select a sample of accession, battle, revolt, political, and city-founding events and verify their source links, confidence, dates, and canonical relationships.

**Acceptance Scenarios**:

1. **Given** any published event, **When** its record is reviewed, **Then** it has at least one supporting source and a confidence classification.
2. **Given** multiple events reference Baghdad, al-Manṣūr, or the Abbasid Caliphate, **When** the corpus is imported, **Then** each shared entity is represented once and reused through relationships.
3. **Given** a source supports multiple events, **When** the corpus is reviewed, **Then** one canonical source record is reused with event-specific citation locators where available.

---

### User Story 3 - Reproduce and Audit the Corpus Import (Priority: P3)

As a maintainer, I can validate and import the structured corpus repeatedly, receive explicit validation errors for unsafe records, and review a manifest summarizing its coverage.

**Why this priority**: Reproducible validation protects historical quality as the corpus expands.

**Independent Test**: Run validation and import twice, compare entity counts, and inspect the generated manifest and deliberate invalid fixtures.

**Acceptance Scenarios**:

1. **Given** a valid corpus, **When** import runs twice, **Then** the second run creates no duplicate events, sources, people, places, states, dates, event types, or relationships.
2. **Given** duplicate slugs, an unknown event type, a missing relationship target, invalid geometry, an invalid temporal range, or a published event without a source, **When** validation runs, **Then** import fails clearly without silently skipping the defect.
3. **Given** a valid corpus, **When** its manifest is produced, **Then** it reports entity counts, event distributions by year and type, non-spatial records, and approximate or disputed records.

### Edge Cases

- Years with no important documented event remain valid empty years; records are never invented to fill gaps.
- Approximate and disputed dates retain their precision and display labels instead of acquiring an unsupported month or day.
- Events spanning multiple years appear for every intersecting year while remaining one canonical event.
- Coordinates may be absent; approximate coordinates must be disclosed in editorial or place reference metadata.
- An unavailable optional URL does not erase otherwise complete bibliographic provenance, but malformed declared URLs fail validation.
- Re-import updates the declared seed-owned fields and relationships while preserving canonical identity.
- Modern labels, roads, points of interest, administrative borders, and political boundaries from a base-map provider never become corpus records.

## Requirements

### Functional Requirements

- **FR-001**: The corpus MUST cover the 132–170 AH review window with approximately 30–50 important, source-backed historical events; any lower count MUST be documented as a quality-driven deviation.
- **FR-002**: The corpus MUST include reusable canonical records for approximately 10–20 people, 10–20 places, the necessary political states, a diverse reusable event-type vocabulary, and non-duplicated sources.
- **FR-003**: Every published event MUST contain an Arabic title, a historical start date, an event type, an Arabic summary, importance, confidence, and at least one source relationship.
- **FR-004**: Events MUST preserve exact, year-only, approximate, disputed, or ranged chronology and MUST NOT introduce unsupported precision.
- **FR-005**: End chronology MUST NOT precede start chronology, and events MUST be discoverable in every selected year intersecting their range.
- **FR-006**: English titles and Gregorian references SHOULD be included only when supported and useful; Hijri chronology remains primary.
- **FR-007**: Shared people, places, states, event types, and sources MUST use stable canonical identifiers and MUST be reused across events.
- **FR-008**: Place geometry MUST be optional, valid when present, and accompanied by an uncertainty or reference note when it is approximate.
- **FR-009**: Only events with geometry MUST produce map features; non-spatial events MUST remain available in timeline and event data.
- **FR-010**: The import package MUST be structured, Arabic-safe, version-controlled, reproducible, validating, idempotent, and designed for later corpus expansion.
- **FR-011**: Validation MUST reject duplicate slugs, unknown event types, missing relationship targets, invalid coordinate ranges, invalid temporal ranges, and published events without sources.
- **FR-012**: Validation failures MUST be explicit and MUST NOT silently skip materially invalid records.
- **FR-013**: A corpus manifest MUST report counts for events, people, places, states, sources, and event types; event distributions by active year and type; non-spatial events; and approximate or disputed records.
- **FR-014**: The existing sourced founding-of-Baghdad record at 145 AH MUST retain its slug, marker behavior, source provenance, and event detail behavior.
- **FR-015**: Source records MUST include organized bibliographic provenance and SHOULD include valid URLs and citation locators when available.
- **FR-016**: The corpus MUST represent major early-Abbasid political transitions, accessions, major battles, revolts, regional events, and selected cultural or scholarly context only where adequately sourced.
- **FR-017**: Base-map content MUST remain geography reference only; all historical labels, places, political entities, and later political boundaries MUST be application-controlled temporal data in accordance with DEC-014.
- **FR-018**: M-01 MUST NOT create political boundary reconstructions, search, journeys, AI features, administrative interfaces, or other later-milestone features.
- **FR-019**: Representative year queries for 132, 136, 145, 158, and 170 AH MUST be verified after import.
- **FR-020**: The complete prior backend and frontend regression suites MUST continue to pass after the corpus is imported.

### Key Entities

- **Historical Event**: A stable, source-backed occurrence with titles, uncertain or ranged chronology, classification, summaries, importance, confidence, publication state, optional geometry, and canonical relationships.
- **Historical Date**: A Hijri-first temporal assertion preserving calendar, year, optional month/day, precision, approximation, and reviewable display labels.
- **Person**: A reusable canonical individual referenced by events, with Arabic name, optional transliteration and aliases, and only well-supported life dates.
- **Place**: A reusable historical location with Arabic name, type, optional geometry, and spatial uncertainty or modern reference metadata.
- **State**: A necessary political entity or movement used for event relationships; boundary reconstruction is excluded.
- **Event Type**: A reusable canonical classification such as battle, accession, revolt, political, city founded, state founded, state fallen, death, cultural, or scientific.
- **Source**: A reusable scholarly, academic, or reviewed primary-source edition with bibliographic provenance and optional URL.
- **Event Relationship**: The event-specific connection to a person, place, state, or source, including role, relation type, citation locator, and support note where applicable.
- **Corpus Manifest**: A review summary of entity totals, chronological and categorical distributions, non-spatial records, and uncertainty classifications.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The reviewed import contains 30–50 published events or a documented accuracy-driven deviation, with 100% of published events linked to at least one source.
- **SC-002**: The corpus contains 10–20 canonical people, 10–20 canonical places, necessary political states, and at least 8 reusable event types without duplicate stable identifiers.
- **SC-003**: Two consecutive imports produce identical entity and relationship counts and zero duplicate stable identifiers.
- **SC-004**: All deliberate invalid-corpus tests are rejected with actionable errors, including each mandatory validation class in FR-011.
- **SC-005**: Queries for 132, 136, 145, 158, and 170 AH return the expected active-event sets, and non-spatial events never create markers.
- **SC-006**: A reader can select 145 AH, see the Baghdad marker, open its details, and inspect its source with no regression from F-05.
- **SC-007**: The manifest reconciles exactly with imported database counts and reports every event by type and every active year in the 132–170 AH window.
- **SC-008**: No base-map-provided modern political label or boundary is introduced, and no M-02 boundary record is created.
- **SC-009**: All existing automated quality gates and the manual multi-year timeline/map review complete without an impactful error.

## Assumptions

- The existing historical schema can represent M-01 without a schema change unless inspection proves a validation requirement cannot be enforced safely.
- Source quality and traceability take precedence over reaching the upper target counts.
- Coordinates represent reviewable geographic references, not archaeological precision; uncertain locations may remain non-spatial.
- M-01 populates historical data and import tooling but does not add person pages, search, boundary reconstruction, or richer M-04 event presentation.
- Public records are seeded only from sources that can be identified bibliographically; AI-generated text is never treated as a source.
