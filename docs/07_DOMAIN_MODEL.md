# Domain Model

## Core aggregate: HistoricalEvent
A historical event is the central connective entity.

### HistoricalEvent
- id
- slug
- title_ar
- title_en
- event_type_id
- summary_ar
- summary_en
- importance_level
- confidence_level
- publication_status
- start_date_id
- end_date_id optional
- primary_place_id optional
- primary_geometry optional
- editorial_notes

## HistoricalDate
Represents uncertain historical dates explicitly.
- calendar: hijri | gregorian | mixed_reference
- year
- month optional
- day optional
- precision: exact | month | year | approximate | disputed
- circa boolean
- display_label_ar optional

## EventType
Examples:
- battle
- accession
- death
- birth
- revolt
- state_founded
- state_fallen
- political
- scientific
- cultural
- religious
- economic
- city_founded
- institution_founded
- treaty
- journey
- disaster

## Person
- id
- canonical_name_ar
- canonical_name_en
- aliases
- birth_date_id
- death_date_id
- biography_summary
- confidence

## PersonRole
Time-aware association such as:
- caliph
- governor
- scholar
- commander
- physician
- mathematician
- translator
- poet

## Place
- id
- name_ar
- name_en
- place_type
- point geometry optional
- region geometry optional
- modern_reference optional

## State/Dynasty
- id
- name_ar
- name_en
- state_type
- start_date
- end_date
- relation_to_abbasid

## PoliticalBoundary
- state_id
- valid_from
- valid_to
- polygon/multipolygon geometry
- confidence
- source_id(s)

## Source
- id
- source_type
- title
- author
- edition
- publication_data
- url optional
- notes

## EventSource
- event_id
- source_id
- citation_text/location
- support_type
- reliability_note

## Relationships
- Event <-> Person many-to-many
- Event <-> Place many-to-many
- Event <-> State many-to-many
- Event <-> Source many-to-many
- Person <-> Place many-to-many with temporal metadata
- State -> PoliticalBoundary one-to-many over time

## Future entities
- Institution
- Book/Work
- Journey
- JourneyStep
- TradeRoute
- BattleDetail
- RelationshipGraphEdge
- AIReconstruction
