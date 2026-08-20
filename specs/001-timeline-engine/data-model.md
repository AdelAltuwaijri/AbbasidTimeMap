# Data Model: F-04 Timeline Engine

No migration is required. F-04 queries F-02 tables.

| Field | Source | Rule |
|---|---|---|
| `year_hijri` | request | Positive selected integer |
| `events` | event + Hijri dates | Published, start <= selected <= end (or open-ended) |
| `event_features` | active event + geometry/place | Point GeoJSON only |
| `boundaries` | boundary + validity dates | valid-from <= selected <= valid-to (or open-ended) |
| `selectedYear` | client state | Sole temporal source of truth |
| `isPlaying` | client state | One timer; false at upper bound |
