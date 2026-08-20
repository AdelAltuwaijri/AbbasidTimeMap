# Timeline State API Contract

## `GET /api/v1/timeline/state?year_hijri={year}`

Returns published state at annual Hijri granularity. `year_hijri` is a required positive integer. Invalid input returns 422; a valid empty year returns 200 with empty collections.

```json
{"year_hijri":145,"metadata":{"granularity":"year","calendar":"hijri"},"events":[],"event_features":{"type":"FeatureCollection","features":[]},"boundaries":{"type":"FeatureCollection","features":[]}}
```
