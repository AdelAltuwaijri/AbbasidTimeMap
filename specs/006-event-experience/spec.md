# Feature Specification: Historical Event Experience

**Feature Branch**: `main`

**Starting SHA**: `7ed250cb9a5aade0447f574a060cdf160a5300dc`

**Created**: 2026-08-21

**Status**: Ready for implementation

**Input**: Expand the existing event drawer into a sourced, uncertainty-aware Historical Event Experience for M-04 without starting M-05.

## User Scenarios & Testing

### User Story 1 - Read a Complete, Trustworthy Event Account (Priority: P1)

An Arabic-speaking visitor can open any published event and understand what happened, when and where it happened, what caused it, what followed, how confident the record is, and which historical sources support it. Only sections backed by the curated record appear.

**Why this priority**: Trustworthy event reading is the core value of M-04 and directly completes the roadmap acceptance criteria for causes, consequences, sources, and confidence.

**Independent Test**: Open a varied set of published events containing different combinations of causes, consequences, uncertainty, relationships, and sources; verify every displayed claim matches the stored public record and every absent field produces no invented section.

**Acceptance Scenarios**:

1. **Given** a published event with causes and consequences, **When** its details open, **Then** separate Arabic sections explain what happened, why it happened, and what followed using only the curated values.
2. **Given** a published event without causes or consequences, **When** its details open, **Then** the unavailable sections are omitted without fabricated placeholders.
3. **Given** an approximate, ranged, circa, or disputed historical date, **When** the event is shown, **Then** its uncertainty is visible rather than flattened into an exact year.
4. **Given** an event supported by multiple sources, **When** its source section is read, **Then** each distinct source appears once with its citation location and appropriate public support information.
5. **Given** a disputed event, **When** its details open, **Then** a neutral notice acknowledges differing accounts without deciding between them.
6. **Given** an unpublished or unknown event, **When** public details are requested, **Then** no historical detail is exposed and a not-found response is returned.

---

### User Story 2 - Continue through Related Historical Context (Priority: P1)

A visitor can select a related person or political entity from the same event experience and continue through the established historical search navigation, changing the shared Hijri year and map focus without creating a new profile experience.

**Why this priority**: Events are the connective entity of the product; relationships must remain navigable without duplicating M-03 or expanding into person/state encyclopedias.

**Independent Test**: From an event containing related people and states, select each relationship and verify the same M-03 result-to-year-to-timeline-to-map sequence is used, with only the declared related event opening a drawer and historical state bounds used where available.

**Acceptance Scenarios**:

1. **Given** a related person, **When** the visitor selects that person, **Then** the established person search context chooses a published related event, updates the shared year, and opens that event in the same experience.
2. **Given** a related state with a published boundary, **When** the visitor selects it, **Then** the shared year changes to the declared historical context and the map frames the historical boundary without opening a state profile.
3. **Given** a relationship with no supported spatial geometry, **When** it is selected, **Then** temporal/contextual navigation still works and no location is invented.
4. **Given** an event reached from a marker, an Event search result, or a Person search result, **When** details load, **Then** all paths display the same event experience and public contract.

---

### User Story 3 - Use Event Details Accessibly on Any Supported Screen (Priority: P2)

A visitor can read and dismiss event details with a pointer or keyboard on desktop, tablet, and mobile widths while retaining the current year, map, selected marker, and layer choices.

**Why this priority**: The richer content must not make the map experience unusable or exclude keyboard and small-screen visitors.

**Independent Test**: Exercise the drawer at representative desktop, tablet, and mobile widths using keyboard-only and pointer input; verify semantic sections, scrolling, focus behavior, stable selection, and map interaction.

**Acceptance Scenarios**:

1. **Given** an event drawer opened from an interactive control, **When** the visitor presses Escape or activates the close control, **Then** the drawer closes, the selected year remains unchanged, and focus returns to the initiating control when it still exists.
2. **Given** the drawer is open, **When** keyboard focus moves forward or backward, **Then** focus remains within the drawer until it closes.
3. **Given** a small screen, **When** a long event is opened, **Then** all sections and source links remain readable and scrollable without horizontal clipping or loss of the close control.
4. **Given** a drawer is already open, **When** another active event is selected, **Then** the content is replaced without a page reload and the new marker remains highlighted.
5. **Given** the selected year changes so the open event is no longer active, **When** the new timeline state arrives, **Then** the drawer closes as it does today.
6. **Given** the same event selection is repeated while its public detail is already available, **When** the event opens again, **Then** no unnecessary duplicate detail request is made.

### Edge Cases

- A source without a valid external URL remains readable as a citation but is not rendered as a broken link.
- Duplicate event-source relationships or repeated source metadata do not create duplicate source cards.
- Missing optional English text never suppresses the Arabic record or leaves an empty heading.
- A date range with different precisions at each endpoint preserves the uncertainty of both endpoints.
- A confidence value describes historical evidence and precision; it is never presented as a binary correct/incorrect judgment or by color alone.
- A failed detail request shows a clear error state without changing the current year, map camera, layer visibility, or marker data.
- Related entity navigation failure leaves the current event readable and reports the navigation failure without inventing fallback context.
- Public detail never exposes internal editorial notes merely because the database column is populated.

## Requirements

### Functional Requirements

- **FR-001**: The public event experience MUST display the stored Arabic title and MAY display the stored English title with correct bidirectional text handling.
- **FR-002**: The event header MUST display the primary Hijri date and its stored Gregorian reference when available.
- **FR-003**: Date presentation MUST distinguish exact dates, year-only dates, approximate dates, circa dates, ranges, and disputed dates without adding unsupported precision.
- **FR-004**: The experience MUST organize available information into semantic sections for the event header, what happened, causes, consequences, related people, related states, place, sources, and confidence.
- **FR-005**: Optional sections MUST be omitted when their curated public value is empty.
- **FR-006**: Causes and consequences MUST come only from their curated event fields and MUST never be generated or inferred at display time.
- **FR-007**: The event detail MUST expose the stored importance and confidence values while the interface also presents understandable Arabic descriptions.
- **FR-008**: Confidence descriptions MUST support every value present in the current public corpus and MUST include a short explanation that confidence may concern chronology, location, or narrative evidence.
- **FR-009**: Disputed records MUST show a neutral notice that versions or estimates differ and MUST NOT imply that disputed means false.
- **FR-010**: The public detail MUST include the primary place and all distinct related places present in the curated record when available.
- **FR-011**: The public detail MUST include all distinct related people and retain their stored relationship roles as API metadata when available; the UI MUST NOT expose raw machine codes as Arabic labels.
- **FR-012**: The public detail MUST include all distinct related states and retain their stored relationship types as API metadata when available; the UI MUST NOT expose raw machine codes as Arabic labels.
- **FR-013**: Each source MUST expose its title, author, publication data, citation locator, support type, suitable public reliability information, and valid external URL when available.
- **FR-014**: Multiple supporting sources MUST be displayed without unnecessary duplication.
- **FR-015**: Historical claims and their supporting source presentation MUST remain visually distinguishable.
- **FR-016**: Internal editorial notes MUST remain private. Public notes MAY appear only when an existing field is explicitly classified as safe for public display; M-04 MUST NOT publish an unclassified note field.
- **FR-017**: Public event details MUST be limited to published events with source provenance and a confidence classification; unknown, non-public, unsourced, and unclassified slugs MUST return not found.
- **FR-018**: Selecting a related person MUST reuse the established M-03 navigation context and MUST NOT create a person biography page.
- **FR-019**: Selecting a related state MUST reuse the established M-03 navigation context, prefer its historical boundary when available, and MUST NOT create a state encyclopedia or use a modern boundary.
- **FR-020**: Missing relationship geometry MUST remain missing; navigation MUST NOT synthesize a point or centroid.
- **FR-021**: Marker selection, Event search selection, and Person search selection MUST open the same event detail experience.
- **FR-022**: The selected event marker MUST remain highlighted while its drawer is open.
- **FR-023**: Opening a different active event MUST replace drawer content without a full page reload.
- **FR-024**: Closing the drawer MUST preserve the shared Hijri year, map camera, and layer visibility.
- **FR-025**: Changing to a year where the event is inactive MUST close the drawer after the corresponding timeline state loads.
- **FR-026**: The map MUST remain operable while event details are open wherever the current responsive layout leaves it visible.
- **FR-027**: The drawer MUST provide a keyboard-accessible close control, Escape dismissal, semantic headings, clear source-link labels, and managed focus.
- **FR-028**: While open, keyboard focus MUST remain within the drawer; on close, focus MUST return to the initiating control when that control is still available.
- **FR-029**: Long event content MUST scroll within its event surface without breaking page layout.
- **FR-030**: The event experience MUST remain usable at representative desktop, tablet, and mobile widths without clipped information or inaccessible controls.
- **FR-031**: Repeated selection of a detail already fetched during the current client session MUST reuse a lightweight local result rather than issue an unnecessary duplicate request.
- **FR-032**: Loading and failure states MUST leave the existing timeline, map data, layer choices, and historical selection stable.
- **FR-033**: Event-to-event previous/next controls are deferred from M-04 because the current Timeline response does not define a canonical intra-year order beyond its returned list; no new ordering query may be invented for this package.
- **FR-034**: The feature MUST contain no AI-authored historical explanation and MUST NOT begin journeys, profiles, M-05, or later AI/admin experiences.

### Key Entities

- **Historical Event Detail**: A published, source-proven event projection containing titles, uncertainty-aware dates, place/type, summary, causes, consequences, importance, confidence, public relationships, and distinct source citations.
- **Historical Date Presentation**: A display representation that preserves calendar, precision, circa status, explicit display label, and optional range endpoints.
- **Related Historical Entity**: A curated Person, State, or Place relationship with stored identity and role/type metadata; Person and State selections reuse existing historical navigation.
- **Source Citation**: A distinct supporting source plus event-specific citation locator, support type, and suitable public reliability context.
- **Event Experience State**: The currently selected event detail, its loading/error status, initiating focus target, and client-session detail cache; it does not own a separate year or map state.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Every current published event with stored causes, consequences, relationships, or multiple sources displays 100% of those public values and no absent optional section.
- **SC-002**: Exact, year-only, approximate/circa, ranged, and disputed date examples each retain their distinguishing wording in automated or manual acceptance checks.
- **SC-003**: Every displayed source card is traceable to one stored source relationship and exposes its event-specific citation locator when present, with zero duplicate cards for the same relationship.
- **SC-004**: A visitor can move from a related person or state to its declared historical context using the existing time-and-map navigation in one interaction.
- **SC-005**: Marker, Event-search, and Person-search entry paths show an identical section contract for the same event.
- **SC-006**: Keyboard-only visitors can open, traverse, and close the event experience; focus never escapes while open and returns to an appropriate initiating control after close.
- **SC-007**: The event experience remains readable and operable at 1280px desktop, 768px tablet, and 390px mobile viewport widths without horizontal content clipping.
- **SC-008**: Opening a cached event detail again performs zero additional detail requests during the same client session.
- **SC-009**: Changing events replaces the visible detail without a page reload, while closing or failure leaves year and layer choices unchanged in all acceptance checks.
- **SC-010**: Under normal local conditions, an uncached event detail becomes readable within one second after selection.
- **SC-011**: Browser verification across the required varied event sample produces no impactful console errors and no unsourced or AI-generated historical claim.
- **SC-012**: All event, map, timeline, search, RTL/accessibility, responsive, regression, lint, and production-build checks pass before M-04 is declared complete.

## Assumptions

- The current curated 132–170 AH corpus remains the complete historical content scope for M-04; no new historical claims are authored merely to fill optional sections.
- Existing event, relationship, source, and historical-date storage is sufficient unless inspection proves a contract field cannot be represented; any actual schema change would require an Alembic migration.
- Existing `editorial_notes` values are internal by default and are not public notes because the current model does not classify them for publication.
- Related people and states reuse M-03 search/navigation semantics rather than adding new profile routes.
- A small in-memory client cache is sufficient for the current corpus and does not require a new dependency.
- Previous/next event controls are deferred as allowed by the feature brief because defining a new canonical ordering would expand scope; the existing timeline and search remain the navigation mechanisms.
- Responsive work is limited to the Event Experience and its immediate integration; application-wide M-06 hardening remains outside this package.
- The historically neutral base map and application-owned temporal boundaries remain governed by DEC-014 and DEC-016.
