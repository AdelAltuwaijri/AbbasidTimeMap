# Database Schema — Logical Baseline

## Database
PostgreSQL with PostGIS extension.

## Naming
- snake_case
- UUID primary keys preferred
- timestamps in UTC for system/editorial metadata
- historical dates stored using historical-date model, not application timestamps

## Core tables

### historical_dates
- id UUID PK
- calendar VARCHAR
- year INT
- month INT NULL
- day INT NULL
- precision VARCHAR
- circa BOOLEAN
- display_label_ar TEXT NULL
- display_label_en TEXT NULL

### event_types
- id UUID PK
- code VARCHAR UNIQUE
- name_ar VARCHAR
- name_en VARCHAR
- icon_key VARCHAR NULL

### historical_events
- id UUID PK
- slug VARCHAR UNIQUE
- title_ar VARCHAR NOT NULL
- title_en VARCHAR NULL
- event_type_id UUID FK
- start_date_id UUID FK
- end_date_id UUID FK NULL
- primary_place_id UUID FK NULL
- summary_ar TEXT
- summary_en TEXT NULL
- causes_ar TEXT NULL
- consequences_ar TEXT NULL
- importance SMALLINT
- confidence_level VARCHAR
- publication_status VARCHAR
- primary_geometry GEOMETRY NULL
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

### people
- id UUID PK
- slug VARCHAR UNIQUE
- canonical_name_ar VARCHAR
- canonical_name_en VARCHAR NULL
- birth_date_id UUID NULL
- death_date_id UUID NULL
- biography_ar TEXT NULL
- biography_en TEXT NULL
- confidence_level VARCHAR

### places
- id UUID PK
- slug VARCHAR UNIQUE
- name_ar VARCHAR
- name_en VARCHAR NULL
- place_type VARCHAR
- point GEOMETRY(Point, 4326) NULL
- area GEOMETRY(MultiPolygon, 4326) NULL
- modern_reference VARCHAR NULL

### states
- id UUID PK
- slug VARCHAR UNIQUE
- name_ar VARCHAR
- name_en VARCHAR NULL
- state_type VARCHAR
- start_date_id UUID NULL
- end_date_id UUID NULL
- relation_to_abbasid VARCHAR NULL

### political_boundaries
- id UUID PK
- state_id UUID FK
- valid_from_date_id UUID FK
- valid_to_date_id UUID FK NULL
- geometry GEOMETRY(MultiPolygon, 4326)
- confidence_level VARCHAR
- notes TEXT NULL

### sources
- id UUID PK
- source_type VARCHAR
- title VARCHAR
- author VARCHAR NULL
- edition VARCHAR NULL
- publication_data TEXT NULL
- url TEXT NULL
- notes TEXT NULL

### event_people
- event_id UUID FK
- person_id UUID FK
- role_code VARCHAR NULL
- PRIMARY KEY(event_id, person_id, role_code)

### event_places
- event_id UUID FK
- place_id UUID FK
- relation_type VARCHAR
- PRIMARY KEY(event_id, place_id, relation_type)

### event_states
- event_id UUID FK
- state_id UUID FK
- relation_type VARCHAR
- PRIMARY KEY(event_id, state_id, relation_type)

### event_sources
- event_id UUID FK
- source_id UUID FK
- citation_locator TEXT NULL
- support_type VARCHAR
- reliability_note TEXT NULL
- PRIMARY KEY(event_id, source_id)

## Spatial indexes
Create GIST indexes on:
- places.point
- places.area
- historical_events.primary_geometry
- political_boundaries.geometry

## Temporal query policy
Because historical dates are uncertain, do not rely exclusively on SQL date types for historical chronology. Provide normalized helper fields or query projections for year-based timeline filtering.

## Publication workflow
Recommended statuses:
- draft
- reviewed
- published
- archived
Only published records appear to public users.
