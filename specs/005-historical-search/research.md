# Research: Historical Search

## Decision 1 — Query-time PostgreSQL search without new schema or extension

**Decision**: Use SQLAlchemy to emit four bounded PostgreSQL entity projections combined into a globally ranked `UNION ALL`. Do not add stored normalized columns, `pg_trgm`, `unaccent`, Elasticsearch, or a vector index.

**Rationale**: The current public corpus is 42 Events, 20 People, 20 Places, and 4 States. A normalized sequential scan over explicitly selected label columns is simple, observable, and well below the M-03 performance target. PostgreSQL still performs filtering, ranking, tie-breaking, spatial projection, and limiting.

**Alternatives considered**:

- Stored normalized columns and functional indexes: premature for the present corpus and would require a migration and synchronization policy.
- PostgreSQL full-text or trigram search: useful at larger scale or for typo tolerance, but not required for the defined exact/prefix/partial behavior.
- External or semantic search: explicitly outside M-03 and would weaken the curated-record boundary.

## Decision 2 — Conservative Arabic normalization

**Decision**: For matching only, apply Unicode NFKC and lowercasing to the input, remove invisible format controls, Arabic diacritics, and tatweel, map `أ/إ/آ/ٱ` to `ا`, map `ى` to `ي`, trim, and collapse whitespace. Mirror the same transformations over database columns. Do not map `ة` to `ه` or `ؤ/ئ` to other letters.

**Rationale**: These rules cover the requested common orthographic variation while avoiding higher-risk changes that conflate distinct words. Original curated strings remain the only display values.

**Alternatives considered**:

- `unaccent`: requires an extension and is broader than the stated Arabic policy.
- Aggressive Arabic stemming or morphology: would create opaque false positives and exceeds simple M-03 search.
- Updating stored names: violates preservation of the curated source record.

## Decision 3 — Public eligibility follows existing publication relationships

**Decision**: Search only published Events. A Person qualifies through at least one published `EventPerson` relationship; a Place through a published `EventPlace` relationship or published Event primary-place relationship; a State through a published `EventState` relationship or published PoliticalBoundary.

**Rationale**: Person, Place, and State do not currently have publication status. Relationship-based eligibility avoids inventing a new publication model while preventing orphan or draft-only internal records from leaking into the public result set.

**Alternatives considered**:

- Return all non-Event entities: can expose unreviewed/orphan records without public historical context.
- Add publication fields: a schema expansion that M-03 does not need.
- Search summaries, biographies, or `modern_reference`: broadens results with prose and can introduce noisy or modern-reference matches; M-03 searches names/titles only.

## Decision 4 — Deterministic, explicit ranking

**Decision**: Rank literal primary-label exact, normalized primary-label exact, primary-label prefix, Person alias exact/prefix, primary-label partial, then alias partial. English primary labels use the same quality tiers when queried; stable slug matching is lower priority. Break ties by match position, shorter normalized primary label, entity type, relevant year, and slug.

**Rationale**: Users can understand why a result appears above another, the shared alias `عبد الله بن محمد` can return both people with different context, and repeated requests remain stable.

**Alternatives considered**:

- One `ILIKE '%q%'` ordering: cannot distinguish exact/prefix/alias quality and yields unstable ties.
- Importance-only ordering: historical importance does not measure textual relevance.
- Frontend merge/rank: would violate query-side ranking and require downloading excess data.

## Decision 5 — Navigation hints come only from published context

**Decision**: Event uses its own stored date and map point. Person and Place use one deterministically ranked published related Event for context/year. State prefers the earliest published Boundary period, falling back to a related published Event. State Boundary navigation returns bounds for `fitBounds`, not a centroid presented as a historical location.

**Rationale**: The corpus has no intrinsic activity year for Places and often no birth year for People. A named published Event gives a verifiable navigation context. Boundary bounds appropriately frame a reconstructed zone without implying that its center is a meaningful historical point.

**Alternatives considered**:

- Death year for People: available for some people but often a less useful discovery context and absent for others.
- First arbitrary relationship: database order is nondeterministic.
- Synthesized Place/State points: violates spatial-fidelity requirements.
- Full Boundary geometry in every result: unnecessarily large for a compact search response.

## Decision 6 — Search coordinates existing state; it does not create new state stores

**Decision**: The search UI sends selection to `MapWorkspace`, which changes the existing Timeline year and waits for the matching response before applying map focus and entity selection. Event-drawer identity is separated from marker identity so an unmapped published Event can still open. Map focus is a request-id-keyed prop; the MapLibre construction effect and layer state remain unchanged.

**Rationale**: This follows the documented result → selected year → Timeline API → map → selection sequence, prevents old-year races, and allows repeated selection of the same result without rebuilding the map.

**Alternatives considered**:

- A search-specific year store: conflicts with DEC-012.
- Navigate immediately before Timeline data arrives: risks clearing the selection against old-year features.
- Recreate MapLibre for each focus: loses camera/layer state and violates the map engine design.

## Decision 7 — Deferred features and baseline-doc scope

**Decision**: Defer shareable URL parameters. Do not add numeric `year` as a fifth result type in M-03 even though the broad baseline FR-08 mentions year search; the approved M-03 package explicitly names Event, Person, Place, and State and requires no year result contract.

**Rationale**: Both additions enlarge state/contract scope without being needed for M-03 acceptance. Direct Timeline controls already provide year navigation.

**Alternatives considered**:

- Add `?year=&event=` synchronization now: useful later, but introduces hydration/history/focus behavior unrelated to core search acceptance.
- Treat a number as a synthetic entity: conflicts with the defined four entity types and result selection semantics.
