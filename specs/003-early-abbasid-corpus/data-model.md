# Data Model: Early Abbasid Seed Corpus

## Seed package

`CorpusPackage` is assembled from all JSON files before persistence.

- `event_types`: reusable classification records
- `sources`: canonical bibliographic records
- `people`: canonical person records
- `places`: canonical historical place records
- `states`: canonical political entity or movement records
- `events`: source-backed historical event records and relationships
- `manifest`: expected deterministic summary

## Seed entities

### SeedHistoricalDate

- `calendar`, `year`, optional `month` and `day`
- `precision`: exact, month, year, approximate, or disputed
- `circa`, `display_label_ar`, optional `display_label_en`

Month and day are range checked. Unsupported precision is forbidden, and an event end year cannot precede its start year.

### SeedEventType

- `code`, `name_ar`, `name_en`, optional `icon_key`

Identity: unique `code`.

### SeedSource

- `key`: stable corpus relationship key, not persisted as a database column
- `source_type`, `title`, optional `author`, `edition`, `publication_data`, `url`, `notes`

Identity: URL when present; otherwise normalized bibliographic fields.

### SeedPerson

- `slug`, `canonical_name_ar`, optional transliteration and aliases
- optional supported birth/death dates and compact biography
- `confidence_level`

Identity: unique `slug`.

### SeedPlace

- `slug`, `name_ar`, optional `name_en`, `place_type`
- optional `[longitude, latitude]` point
- optional `modern_reference`; required as an uncertainty/reference note for approximate points

Identity: unique `slug`. Longitude is -180..180 and latitude is -90..90.

### SeedState

- `slug`, `name_ar`, optional `name_en`, `state_type`
- optional supported start/end dates and `relation_to_abbasid`

Identity: unique `slug`. M-01 creates no political boundary records.

### SeedEvent

- stable slug and Arabic/optional English titles
- event type and start/optional end dates
- Arabic/optional English summaries, causes, and consequences
- importance, confidence, publication status
- optional primary place and geometry with editorial uncertainty note
- arrays of person, place, state, and source relationships

Validation requires unique slugs, resolvable references, at least one source for published events, valid chronology and geometry, and consistent primary-place relations.

## Database mapping

- Seed entities map to existing `event_types`, `historical_dates`, `sources`, `people`, `places`, `states`, and `historical_events` tables.
- Relationship arrays map to `event_people`, `event_places`, `event_states`, and `event_sources`.
- The importer updates seed-declared fields, reuses canonical rows, and reconciles relationship rows for seed-owned events.
- The importer never writes `political_boundaries`.

## Manifest

- Counts: events, people, places, states, sources, event types
- Events by active year: 132–170, with ranges counted in each intersecting year
- Events by type
- Sorted non-spatial event slugs
- Sorted approximate or disputed event slugs

The committed manifest must exactly equal the value recomputed from validated seed files.
