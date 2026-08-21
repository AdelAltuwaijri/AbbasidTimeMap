# Phase 0 Research: Historical Event Experience

## Decision 1 — Extend the existing projection; do not migrate the database

**Decision**: Add fields to the public `EventDetail` schema/service only.

**Rationale**: `HistoricalEvent`, `HistoricalDate`, `EventPerson`, `EventPlace`,
`EventState`, `EventSource`, and `Source` already store every required value:
date precision/circa/ranges, causes, consequences, importance, confidence,
relationship roles/types, and citation metadata. A migration would add duplicate
state and violate the minimum-package principle.

**Alternatives rejected**:

- A new event-detail table would duplicate the curated source of record.
- Reusing `editorial_notes` as a public note would leak an unclassified internal
  field; public notes require a future explicit field and curation policy.

## Decision 2 — Keep the contract additive and structured

**Decision**: Preserve current flattened compatibility fields and add structured
`start_date`, optional `end_date`, optional narratives, typed related entities,
and richer source objects.

**Rationale**: Existing marker/search paths consume current fields. Structured
dates are necessary to preserve endpoint-specific precision and circa values,
while additive evolution avoids breaking those paths.

**Alternatives rejected**:

- Formatting all uncertainty only into one string discards machine-readable
  precision and cannot faithfully represent mixed-precision ranges.
- Returning ORM objects directly risks leaking publication/editorial fields.

## Decision 3 — Treat editorial and source notes as private by default

**Decision**: Never return `HistoricalEvent.editorial_notes` or `Source.notes`.
Only event-specific `EventSource.reliability_note`, already part of the curated
support relationship, is eligible for public display.

**Rationale**: Neither general note column has a public/private classification.
The event-source reliability text is scoped to the cited claim and explicitly
requested by the feature.

## Decision 4 — Enforce published and source-proven details at the public query

**Decision**: A public event detail must have `publication_status='published'`,
at least one `EventSource`, and a non-null confidence classification. Unknown,
draft, reviewed, archived, unsourced, or unclassified events all resolve as not
found. Other nullable model fields remain nullable in the additive response.

**Rationale**: Publication services protect normal writes, but public reads need
defense in depth and the constitution requires confidence on every public event.
Returning 404 prevents record-existence leakage and avoids response-validation
failures for a record that does not meet the public invariant.

## Decision 5 — Reuse M-03 for related people and states

**Decision**: Related entity buttons resolve the exact entity through the existing
historical search endpoint and feed the selected `SearchResult` to the same
`MapWorkspace` navigation sequence used by SearchCommand.

**Rationale**: This preserves deterministic representative event/year/bounds
selection, shared Timeline state, and DEC-014. It avoids profile pages, duplicate
navigation policy, and invented coordinates.

**Alternatives rejected**:

- A new person/state detail endpoint is M-05/later profile scope.
- Client-selected arbitrary related events would diverge from DEC-017 ranking and
  temporal navigation.
- Computing centroids for states or places would invent historical focus geometry.

## Decision 6 — Cache successful details only

**Decision**: Store successful `EventDetail` objects in a `Map<string, EventDetail>`
owned by the current `MapWorkspace` session. Do not cache failures; retry bypasses
no valid data.

**Rationale**: The corpus is small, details are immutable during a client session,
and this eliminates duplicate requests without a dependency or global store.
Abort/sequence protection remains responsible for stale responses.

## Decision 7 — Accessibility follows a contained event surface

**Decision**: Use a semantic dialog surface with an accessible title, focus moved
to the close control on open/replacement, Escape dismissal, keyboard containment,
and return focus when the initiating element still exists. Long content scrolls
inside the surface; pointer map interaction remains available where visible.

**Rationale**: The richer surface needs predictable keyboard navigation and must
not lose the close control on small screens. Responsive presentation is a bottom
sheet on mobile and side drawer from tablet widths.

## Decision 8 — Defer previous/next controls

**Decision**: Do not add event-to-event controls in M-04.

**Rationale**: The timeline contract does not declare canonical intra-year order.
Using response order as product semantics would create an undocumented rule and
expand tests/API behavior. Search and markers already provide event navigation.

## Corpus findings

- The current package contains 42 published events and all are source-proven.
- Current curated causes and consequences are empty, so production UI must omit
  those sections. Their support is proven with synthetic test fixtures; no content
  is invented for the corpus.
- The corpus contains ranges, circa dates, approximate precision, disputed dates,
  and events with multiple sources, enabling genuine uncertainty/source checks.
- Gregorian labels are not uniform: some are combined Hijri/Gregorian labels and
  others are plain Gregorian text. The compatibility `gregorian_reference` helper
  therefore preserves a plain label instead of returning null.
