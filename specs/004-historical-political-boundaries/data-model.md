# Data Model: Historical Political Boundaries

## PoliticalBoundary

One published reconstruction of one state's political-control envelope for an inclusive Hijri period.

| Field | Rule |
|---|---|
| `id` | UUID primary key |
| `slug` | Stable unique lowercase/hyphen identity |
| `state_id` | Required FK to canonical `states` record |
| `valid_from_date_id` | Required Hijri HistoricalDate FK |
| `valid_to_date_id` | Required Hijri HistoricalDate FK for M-02 |
| `geometry` | Non-empty valid MultiPolygon, SRID 4326 |
| `confidence_level` | `high`, `medium`, `approximate`, or `disputed`; M-02 uses `medium` |
| `spatial_precision` | `exact`, `approximate`, or `disputed`; M-02 uses `approximate` |
| `publication_status` | `draft`, `reviewed`, `published`, or `archived` |
| `notes` | Concise Arabic reconstruction warning/summary |
| `methodology_notes` | Inclusion/exclusion and geometry construction method |
| `limitations_notes` | Epistemic and cartographic limitations |
| `overlap_justification` | Optional explanation for an intentionally overlapping record |

### Validation

- Start/end calendars are Hijri and `valid_from.year <= valid_to.year`.
- Published records require state, notes, methodology, limitations, and at least one BoundarySource.
- Geometry is MultiPolygon, non-empty, valid, bounded to WGS84 coordinates, and SRID 4326.
- Same-state validity intervals may not overlap unless every overlapping record explicitly justifies it.
- Stable slugs and identical state/date pairs may not repeat.

## BoundarySource

Auditable many-to-many association between PoliticalBoundary and Source.

| Field | Rule |
|---|---|
| `boundary_id` | Required FK, cascade delete, composite PK |
| `source_id` | Required FK, cascade delete, composite PK |
| `citation_locator` | Page, section, figure, or article passage when available |
| `support_type` | `territorial_change`, `regional_control`, `chronology`, `geographic_cross_check`, or equivalent reviewed code |
| `reliability_note` | Optional note on how the source supports or limits the reconstruction |

## Relationships

- State 1 → many PoliticalBoundary records.
- PoliticalBoundary many ↔ many Source through BoundarySource.
- HistoricalDate is reused canonically across events, states, and boundaries.
- TimelineState serializes only published PoliticalBoundary records active for the selected year.

## State transitions

`draft → reviewed → published → archived`

Publication performs validation; import converges a declared published record only after its source links exist.

## Package model

`data/boundaries/m02/boundaries.geojson` is the reviewable geometry/source-link graph. `sources.json` contains M-02-specific scholarly source metadata. `manifest.json` records exact count, periods, states, precision/confidence distribution, feature vertex counts, and non-overlap summary.
