# Research: Early Abbasid Seed Corpus

## Decision 1 — Chronological source backbone

**Decision:** Use the annotated SUNY translation of al-Ṭabarī, volumes 27–30, as the chronological/near-classical backbone, and cross-check interpretive summaries with modern academic works and scholarly reference articles.

**Rationale:** Volumes 27–30 directly cover the Abbasid revolution through the accession of Hārūn al-Rashīd. The edition is a complete scholarly translation under Ehsan Yarshater's general editorship, and the volume/year structure provides reviewable locators without pretending every report is uncontested. Modern works provide critical framing and confidence judgments.

**Alternatives considered:** Anonymous web chronologies were rejected as unauditable. A single modern encyclopedia was rejected as too compressed for 30+ event records. Primary chronicles alone were rejected because reported narratives require modern critical context.

## Decision 2 — Main modern cross-checks

**Decision:** Reuse canonical records for Hugh Kennedy's *The Early Abbasid Caliphate: A Political History* and relevant Encyclopaedia Iranica articles, including entries on the Abbasid caliphate, Abū Moslem, Khorasan in the Abbasid period, Baghdad, Moqannaʿ, Herat, the Barmakids, and Hārūn al-Rashīd. Use focused academic monographs for the 145 AH Hasanid rebellion where needed.

**Rationale:** These works provide scholarly synthesis for institutional change, provincial revolts, succession, and the limits of source certainty. Iranica articles expose bibliographies and stable public URLs; Kennedy supplies a coherent modern political history.

**Alternatives considered:** Britannica remains a useful orientation reference but is not used as sole support for contested events. Encyclopaedia of Islam is strong but access and stable public locators are inconsistent, so it is not required for reproducible local review.

## Decision 3 — Structured source-of-record format

**Decision:** Store six normalized UTF-8 JSON files for event types, sources, people, places, states, and events, plus a deterministic manifest.

**Rationale:** JSON natively preserves Arabic and nested relationship/citation structures, is dependency-free in Python, produces reviewable diffs, and separates historical content from importer code.

**Alternatives considered:** CSV was rejected because nested sources and relationships become fragile. YAML was rejected to avoid an additional parser and implicit scalar conversion. A large hard-coded Python seed was rejected as difficult to review and extend.

## Decision 4 — Validation before persistence

**Decision:** Parse every file into strict Pydantic models, then perform a second whole-corpus graph validation before opening the write transaction.

**Rationale:** Field validation catches malformed dates, coordinates, enums, and URLs; graph validation catches duplicate slugs, unknown event types, missing entity references, missing published-event sources, and temporal inversions. No materially invalid record is silently skipped.

**Alternatives considered:** Database-only constraint handling was rejected because error messages would be fragmented and several governance rules span files and relationships.

## Decision 5 — Idempotent canonical persistence

**Decision:** Upsert entities by stable corpus keys: code for event types, slug for events/people/places/states, URL for linked sources when present, and a normalized bibliographic identity otherwise. Reuse full historical-date value tuples and reconcile event-owned relationship rows.

**Rationale:** This matches existing uniqueness rules where available, preserves canonical shared records, and makes repeated imports converge to identical counts. The entire import is committed atomically.

**Alternatives considered:** Deleting and recreating the corpus was rejected because it changes UUIDs and risks breaking references. Fixed UUIDs in content files were rejected as review noise at this scale.

## Decision 6 — No schema migration for M-01

**Decision:** Reuse the existing historical entities and relationship tables without adding columns or constraints.

**Rationale:** Existing models already represent event types, uncertain/ranged dates, canonical people/places/states/sources, event relationships, editorial notes, and optional PostGIS geometry. Import-layer validation covers the additional package rules.

**Alternatives considered:** Adding a seed-key column to sources could simplify lookup but is unnecessary for this bounded corpus and would expand schema scope.

## Decision 7 — Spatial uncertainty and DEC-014

**Decision:** Include a point only for events with a confidently identifiable geographic reference; treat city coordinates as approximate geographic anchors and say so in place/event notes. Leave uncertain regional events non-spatial. Create no political boundary rows.

**Rationale:** Coordinates are for map orientation, not archaeological precision. Application-owned place names remain separate from the physical base map, satisfying temporal/spatial fidelity and DEC-014.

**Alternatives considered:** Geocoding every named place or borrowing provider labels/borders was rejected because it introduces modern and false precision. M-02 polygon reconstruction is explicitly deferred.

## Decision 8 — Deterministic manifest

**Decision:** Compute the manifest from validated events, counting each ranged event in every active Hijri year, and commit the expected JSON alongside the corpus. Tests compare recomputed and committed manifests.

**Rationale:** Reviewers can see corpus shape without a database, while drift is caught automatically.

**Alternatives considered:** A prose-only summary was rejected because it drifts. A database-only report was rejected because it cannot validate the files before import.

## Decision 9 — Preserve F-05 identity

**Decision:** The M-01 event record for `founding-of-baghdad` reuses the existing slug, Baghdad place, al-Manṣūr person, Abbasid state, and Iranica source URL. The original explicit F-05 seed remains runnable.

**Rationale:** This retains the acceptance path and makes either seed order converge without duplicate canonical entities.

**Alternatives considered:** Renaming or replacing the F-05 event was rejected as a regression. Removing the explicit F-05 seed was rejected because it remains a useful focused fixture.
