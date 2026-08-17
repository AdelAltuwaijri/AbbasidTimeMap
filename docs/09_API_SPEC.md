# API Specification — v1 Baseline

Base prefix: `/api/v1`

## Health
### GET /health
Returns application health.

## Timeline
### GET /timeline/state?year_hijri=145
Returns the historical state for the selected year.

Example response shape:
```json
{
  "year_hijri": 145,
  "year_gregorian_display": "762–763",
  "events": [],
  "boundaries": [],
  "places": [],
  "people_highlights": []
}
```

### GET /timeline/events?from_hijri=132&to_hijri=170
Returns event summaries suitable for timeline ticks/clusters.

## Events
### GET /events/{slug}
Full event detail.

### GET /events?year_hijri=145&type=battle
Filtered event list.

## People
### GET /people/{slug}
Returns person detail and related events.

### GET /people?alive_in_hijri=145
Returns people whose known/estimated lifespan intersects the selected year.

## Places
### GET /places/{slug}
Returns place detail and geometry.

## States
### GET /states?active_in_hijri=145
Returns active political entities.

### GET /states/{slug}/boundaries?year_hijri=145
Returns the time-valid boundary geometry.

## Search
### GET /search?q=بغداد
Returns categorized results.

Each result should include navigation hints:
```json
{
  "entity_type": "event",
  "slug": "founding-of-baghdad",
  "label": "تأسيس بغداد",
  "focus_year_hijri": 145,
  "map_focus": {"lat": 33.3152, "lng": 44.3661}
}
```

## Sources
### GET /events/{slug}/sources
Returns source references and notes.

## GeoJSON
Map endpoints may return GeoJSON FeatureCollection where appropriate.

## Error contract
```json
{
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "...",
    "details": null
  }
}
```

## API rules
- No frontend component directly queries the database.
- Public endpoints return only published data.
- Historical confidence and source metadata are not stripped from detailed historical responses.
