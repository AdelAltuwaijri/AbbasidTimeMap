# Feature Specification: Historical Search

**Feature Branch**: `main`

**Created**: 2026-08-21

**Status**: Draft

**Input**: M-03 — add Arabic-first historical search across events, people, places, and states, then use each result to navigate the existing shared Hijri timeline, map, and selection experience without entering M-04.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a Historical Entity in Arabic (Priority: P1)

An Arabic-speaking visitor enters a historical name or title and receives a short, clearly ranked list of matching published events and publicly relevant people, places, and states. Each result identifies its entity type and enough historical context to distinguish it from other results.

**Why this priority**: Reliable Arabic discovery is the foundation of M-03; navigation cannot work if the intended entity cannot be found or distinguished.

**Independent Test**: Search the current corpus for an event, person by canonical name, person by alias, place, and state—including spelling with Arabic alef variants or diacritics—and verify relevant, type-labelled results appear in a stable order while private events never appear.

**Acceptance Scenarios**:

1. **Given** published historical records, **When** the visitor searches an exact Arabic event title, **Then** that event is the highest-ranked relevant result.
2. **Given** a person with a canonical name and an alias, **When** either form is searched, **Then** the same person is returned with a concise related-event context.
3. **Given** Arabic text containing alef variants, diacritics, tatweel, or repeated spaces, **When** it is searched, **Then** equivalent stored names can match without changing their original display spelling.
4. **Given** matching records of more than one entity type, **When** results appear, **Then** every row includes a textual entity-type label and historical context rather than relying on color alone.
5. **Given** draft, reviewed, archived, and published events, **When** a query matches all of them, **Then** only published events contribute public event results or navigation context.

---

### User Story 2 - Navigate Search Results through Historical Time and Space (Priority: P1)

A visitor selects a result and the existing central Hijri year changes to the result's meaningful historical year. The timeline refreshes the historical world, the map focuses a known location when one exists, and the appropriate existing selection experience is used without fabricating geometry or an entity profile.

**Why this priority**: Search is a navigation mechanism inside the historical experience, not a detached result page.

**Independent Test**: Select one result of each supported entity type and verify the shared selected year, current map data, camera focus, and selection state follow the rules for that entity while layer choices and the single map instance are preserved.

**Acceptance Scenarios**:

1. **Given** an event result, **When** it is selected, **Then** the shared year changes to the event's start year, the matching marker is selected after the year data loads, the map focuses its known geometry, and the existing event drawer opens.
2. **Given** a place result with coordinates and a related published event, **When** it is selected, **Then** the shared year changes to that event's year and the map focuses the place without opening an unrelated event drawer.
3. **Given** a person result with related published events, **When** it is selected, **Then** the result's displayed related-event context determines the year and event selection, and the existing event drawer opens for that event rather than a new person profile.
4. **Given** a state result with a published historical boundary, **When** it is selected, **Then** the shared year changes to a year when that boundary is valid and the map frames that reconstructed extent without opening an event or state encyclopedia.
5. **Given** a result without supported geometry, **When** it is selected, **Then** temporal or contextual navigation still occurs and no artificial map point is created.
6. **Given** custom layer visibility choices, **When** any search result is selected, **Then** those visibility choices remain unchanged.

---

### User Story 3 - Search Reliably with Keyboard and Failure Feedback (Priority: P2)

A visitor can operate the Arabic search entirely by keyboard, understand loading, empty, and failure states, close the result list, and continue using the map when search is unavailable.

**Why this priority**: Search is a primary navigation control and must remain usable, accessible, and non-disruptive.

**Independent Test**: Use only the keyboard to type, move through results, select one, and dismiss the list; separately simulate no results and a request failure and confirm the page, map, timeline, and focus remain usable.

**Acceptance Scenarios**:

1. **Given** an open result list, **When** the visitor presses the arrow keys, **Then** the active result changes visibly and is announced through standard accessible control semantics.
2. **Given** an active result, **When** Enter is pressed, **Then** that result is selected and focus returns to a sensible control after navigation.
3. **Given** an open result list, **When** Escape is pressed, **Then** the list closes without changing the selected year, map layers, or current entity.
4. **Given** a valid query with no match, **When** the request completes, **Then** an Arabic empty-state message appears.
5. **Given** a search failure, **When** the request fails, **Then** an Arabic failure message appears and the existing map and timeline remain interactive.
6. **Given** rapid query changes, **When** an earlier response completes after a later one, **Then** the stale response does not replace the latest results.

### Edge Cases

- Empty or one-character input does not execute an unhelpful search and does not leave stale results visible.
- Leading, trailing, and repeated whitespace is normalized only for matching.
- Queries longer than the supported maximum are rejected predictably and cannot degrade the page.
- Literal exact matches outrank broader normalized, alias, prefix, and partial matches; ties remain deterministic.
- A canonical-name match outranks an alias-only match of otherwise equal quality.
- A place without coordinates or a state without a valid boundary still returns only when it has public historical context, but selection does not fabricate map geometry.
- A person, place, or state with no published event or boundary context is not exposed merely because an internal record exists.
- Search results remain compact and never include full event detail, biographies, profiles, source lists, or boundary geometry.
- Closing search or encountering an error does not clear an already selected event or alter layer controls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide Arabic-first historical search over event titles, person canonical names, person aliases, place names, and state names.
- **FR-002**: Existing English names MAY be searchable, but English support MUST NOT weaken or block Arabic behavior.
- **FR-003**: Matching MUST ignore Arabic diacritics and tatweel, unify common alef forms, unify alif maqsura with yeh, trim surrounding whitespace, and collapse internal whitespace without changing stored or displayed values.
- **FR-004**: The adopted normalization policy MUST be documented as a stable project decision.
- **FR-005**: Ranking MUST use understandable tiers in this order: literal exact canonical match, normalized exact canonical match, canonical prefix match, alias match, then canonical or alias partial match.
- **FR-006**: Results with equal match quality MUST use stable historical and lexical tie-breakers so repeated requests return the same order.
- **FR-007**: Search filtering, matching, ranking, and result limiting MUST occur before results reach the browser; the browser MUST NOT download the corpus to search it.
- **FR-008**: Event results and all event-derived navigation context MUST use published events only.
- **FR-009**: People, places, and states MUST be exposed only when connected to at least one published event, or for a state, to a published historical boundary.
- **FR-010**: Every result MUST include entity type, stable identity, slug, Arabic display label, a concise factual subtitle/context, a relevant Hijri year, and only the optional end year, point coordinates, boundary bounds, confidence, and navigation-event identity that are supported by existing data.
- **FR-011**: Result payloads MUST remain compact and MUST NOT include full detail records, biographies, source lists, or polygon geometry.
- **FR-012**: A request MUST contain between 2 and 100 visible characters after trimming.
- **FR-013**: A request MUST return at most 20 results, with 10 as the default result limit.
- **FR-014**: Search input MUST be treated as data and MUST NOT be interpolated into executable query text.
- **FR-015**: The main historical page MUST provide a clearly labelled Arabic RTL search input with a lightweight result list.
- **FR-016**: The result list MUST expose loading, no-results, and failure feedback in Arabic without blocking the map or timeline.
- **FR-017**: The result list MUST support Up/Down navigation, Enter selection, Escape dismissal, visible active-result state, and correct focus behavior.
- **FR-018**: Result types MUST be distinguished by text and accessible semantics, not by color alone.
- **FR-019**: Event selection MUST change the existing shared Hijri year, wait for the matching timeline state, select/focus the existing marker when geometry exists, and open the existing event drawer.
- **FR-020**: Place selection MUST use a deterministic related published event year where available, focus stored coordinates where available, and MUST NOT open an event drawer as if the place were an event.
- **FR-021**: Person selection MUST use the explicitly displayed deterministic related published event, change to its year, and open that existing event context without introducing a person profile.
- **FR-022**: State selection MUST prefer a year with a published historical boundary, frame that stored reconstructed extent when available, and MUST NOT reduce the state to an invented point or introduce a state profile.
- **FR-023**: Selection without supported coordinates MUST perform only the available temporal/contextual navigation and MUST NOT create synthetic geometry.
- **FR-024**: Search navigation MUST preserve the current map instance and every layer visibility choice.
- **FR-025**: Search-triggered navigation MUST follow the existing sequence: result selection, shared year change, timeline response, map update, then entity selection or focus.
- **FR-026**: Rapid or cancelled searches MUST NOT allow stale responses to replace results for the latest query.
- **FR-027**: A search failure MUST leave the existing timeline, map, and current selection operational.
- **FR-028**: The public search contract and its validation and result behavior MUST be documented.
- **FR-029**: Shareable URL search/selection state is deferred unless it can be added without expanding this package; this deferral MUST NOT block M-03 acceptance.
- **FR-030**: Semantic or AI search, embeddings, vector storage, Ask History, full person/state profiles, journeys, administration, and M-04 or later features MUST remain out of scope.

### Key Entities

- **Search Query**: User-supplied text plus a bounded result limit; it is normalized transiently for matching and never replaces stored historical text.
- **Search Result**: A compact navigation projection containing entity identity, type, display label, context, meaningful Hijri year, and optional supported point, boundary-bounds, or event-navigation hints.
- **Navigation Context**: A published event or published boundary chosen deterministically to connect a person, place, or state result to the existing timeline and map.
- **Historical Entity**: An existing Event, Person, Place, or State record; M-03 does not create a new historical content model.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Each of the five required corpus queries—«بغداد»، «أبو مسلم»، «الزاب»، «المنصور»، and «الخلافة العباسية»—returns at least one correct, distinguishable result during live review.
- **SC-002**: Exact event, canonical person, alias person, place, state, normalized Arabic, prefix, and partial searches all pass automated acceptance checks.
- **SC-003**: 100% of returned event results and event-derived navigation contexts are published records; no draft, reviewed, or archived event appears.
- **SC-004**: Every successful result selection changes to its declared relevant Hijri year and, when a supported point or boundary extent exists, focuses the intended spatial context without a full-page reload.
- **SC-005**: Event and person navigation open the declared existing event context; place and state navigation never open a fabricated event or profile.
- **SC-006**: A keyboard-only user can open results, traverse every result, select one, and dismiss the list without a pointer.
- **SC-007**: Valid searches show no more than the requested capped result count, and empty, overlong, no-match, failed, and rapidly superseded queries behave predictably.
- **SC-008**: Search selection leaves all map layer visibility choices unchanged and does not create an additional map instance.
- **SC-009**: Under normal local corpus conditions, the visitor sees results or a clear empty state within one second after input settles.
- **SC-010**: All search, timeline, map, RTL/accessibility regression, lint, and production-build checks pass with no impactful browser-console errors.

## Assumptions

- The current 132–170 AH curated corpus is small enough for straightforward bounded ranked search; an external index or semantic service is unnecessary.
- For a person with several published events, the deterministic navigation context first prefers a stable identity-relevant event slug, then importance, supported point geometry, earliest Hijri year, and stable slug order; for a place, it prefers highest importance, then earliest Hijri year and stable slug order. The chosen event is named in the result subtitle.
- For a state, the deterministic navigation context prefers the earliest published boundary period; when no published boundary exists, the same published-event preference applies.
- Place selection deliberately preserves a simple selected-result context and map focus without opening the related event drawer; person selection deliberately opens its declared related event because M-03 does not add a person profile.
- State focus uses the published historical reconstruction's bounding extent, not a synthetic centroid presented as a historical place, and never adds external or modern political data.
- Search state is session-local for M-03. Shareable URL parameters are documented as a later enhancement because they are not required for acceptance.
- Existing event details, timeline state, map layers, boundary display, historically neutral base map, and Arabic RTL shell remain the source of navigation behavior rather than being duplicated inside search.
