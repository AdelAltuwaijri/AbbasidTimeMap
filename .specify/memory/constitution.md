<!--
Sync Impact Report
Version change: 1.0.0 -> 1.0.1
Modified principles:
- IV. Approved Stack and Schema Discipline: clarified MapLibre GL JS as initial
  implementation preference unless superseded by approved architecture decision
Added sections:
- None
Removed sections:
- None
Follow-up TODOs:
- None
-->
# AbbasidTimeMap Constitution

## Core Principles

### I. Arabic-First Historical Experience
AbbasidTimeMap MUST treat Arabic as the primary user experience. UI layout, navigation,
search, labels, typography, and historical presentation MUST preserve RTL behavior and
correct Bidi handling for English names, code-like identifiers, numbers, dates, and source
metadata. Gregorian context MAY be shown, but Hijri chronology MUST remain primary wherever
historical time is selected, filtered, searched, or displayed.

Rationale: The product is built for Abbasid history and must make Arabic historical reading
and navigation feel native, not translated after the fact.

### II. Source-Proven Historical Record
Published historical records MUST be curated records with explicit provenance, never AI output
or unreviewed generated text. Every published historical event MUST have at least one source
record, a confidence classification, and traceable links from public details back to source
data. Disputed accounts MUST preserve the disagreement instead of flattening it into a single
unsupported statement.

Rationale: Historical trust is the core product value; the application must be able to explain
where each public claim came from.

### III. Temporal and Spatial Fidelity
The system MUST preserve approximate, disputed, Hijri, Gregorian, and ranged historical dates
without inventing unsupported precision. Spatial data MUST preserve uncertainty through
appropriate point, region, approximate, unknown, or confidence-aware representations. Historical
content, spatial data, and AI-generated media MUST remain clearly separated in storage,
services, APIs, and presentation.

Rationale: Abbasid history often contains uncertain chronology and geography; the model must
represent that uncertainty directly instead of hiding it.

### IV. Approved Stack and Schema Discipline
The frontend MUST use Next.js with TypeScript. The backend MUST use FastAPI. Persistent spatial
data MUST use PostgreSQL with PostGIS. Interactive maps SHOULD use MapLibre GL JS for the
initial implementation unless an approved architecture decision selects another mapping
library. Every database schema change MUST include an Alembic migration and a practical
validation path for the changed behavior.

Rationale: A stable stack keeps implementation package-by-package and prevents hidden
architecture drift.

### V. Simple, Scoped Delivery
Work MUST reuse the existing project structure, conventions, roadmap packages, and documented
architecture. Implementations MUST avoid unnecessary abstractions, speculative features, and
scope expansion outside approved package goals. New Git branches MUST NOT be created unless the
user explicitly requests one.

Rationale: The project depends on disciplined incremental delivery more than broad framework
design or feature invention.

## Project Constraints

- Historical source data MUST remain the source of record; AI is only an interpretive or media
  generation layer.
- AI-generated historical media MUST be clearly distinguishable from documented historical
  facts in UI, metadata, and stored review state.
- AI-generated visuals or videos published to users MUST be labeled as AI-assisted historical
  reconstructions, not authentic evidence.
- Historical content, spatial geometry, provenance, editorial status, and AI artifacts MUST
  remain separable enough to audit, test, and replace independently.
- Public historical details MUST NOT present exact quotes, dates, places, costumes,
  architecture, or causal claims as established fact unless supported by source records or
  explicitly marked as uncertain or reconstructed.
- PostgreSQL/PostGIS is authoritative for persisted spatial queries; GeoJSON MAY be used over
  REST/JSON APIs for initial delivery.
- Documentation MUST stay lightweight and decision-oriented. Large documents, new conventions,
  or broad refactors require an explicit scope reason.

## Development Workflow and Quality Gates

- Work MUST proceed package-by-package from `docs/16_ROADMAP_AND_MILESTONES.md`.
- Package completion MUST be checked against `docs/18_ACCEPTANCE_CRITERIA.md` before being
  declared done.
- Changes MUST be inspected against existing code and docs before editing.
- Tests MUST be practical and risk-based: date logic, source validation, schema migrations,
  spatial behavior, API contracts, RTL/Bidi rendering, and critical map/timeline flows require
  coverage when touched.
- Lint, build, and relevant tests MUST be run before declaring implementation work complete, or
  the reason they could not be run MUST be reported.
- New or changed historical publication behavior MUST reject or flag published events without
  sources.
- Schema changes MUST include Alembic migrations and must not rely on manual database edits.
- Architecture or scope changes outside the approved docs MUST be captured as explicit
  decisions before implementation proceeds.

## Governance

This constitution supersedes conflicting ad hoc practices for AbbasidTimeMap. Project docs,
feature specifications, plans, tasks, implementation reviews, and acceptance checks MUST be
interpreted through these principles.

Amendments MUST be made by updating this constitution, explaining the sync impact, and using
semantic versioning:
- MAJOR for backward-incompatible governance changes or principle removals.
- MINOR for new principles, new governance sections, or materially expanded rules.
- PATCH for clarifications, wording fixes, and non-semantic refinements.

Compliance review is required at package boundaries and before declaring a feature complete.
Reviews MUST check Arabic-first UX, source traceability, temporal/spatial uncertainty, approved
stack usage, Alembic migrations for schema changes, scope control, and relevant tests.

**Version**: 1.0.1 | **Ratified**: 2026-08-18 | **Last Amended**: 2026-08-18
