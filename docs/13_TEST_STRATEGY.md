# Test Strategy

## Goals
Tests must protect the behaviors that make this product historically and technically trustworthy.

## Backend unit tests
Cover:
- historical date intersection
- approximate/range date behavior
- active-state queries
- boundary validity selection
- publication-status filtering
- source requirement validation

## API tests
Cover:
- health endpoint
- timeline state endpoint
- event detail
- search navigation metadata
- missing entity handling
- malformed year/filter handling

## Database integration tests
Use PostgreSQL/PostGIS test database.
Cover:
- migrations
- spatial indexes
- spatial serialization
- boundary year selection

## Frontend component tests
Cover:
- timeline controls
- event drawer states
- layer toggles
- RTL rendering where practical

## End-to-end tests
Critical path:
1. open app
2. change year
3. verify event/map state updates
4. click event
5. verify details and sources
6. search for event
7. navigate map/time from search result

## Visual checks
Map-heavy UI requires manual/visual verification for:
- overlapping labels
- marker clustering
- RTL/LTR Bidi
- responsive layout
- drawer/map interaction

## Historical data validation tests
Automated checks should flag:
- published event with no source
- end year earlier than start year
- invalid confidence value
- boundary without valid range
- orphaned relationships

## MVP test threshold
Before MVP completion:
- all critical unit/integration tests pass
- no known P0/P1 defects
- seed dataset passes validation
