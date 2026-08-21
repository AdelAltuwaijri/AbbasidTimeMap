# Data Model: Historical Search

M-03 introduces no persistent table or column. It defines transient query and navigation projections over existing curated records.

## SearchQuery

| Field | Shape | Rules |
|---|---|---|
| `q` | string | 2–100 visible characters after trimming and search normalization |
| `limit` | integer | Default 10; range 1–20 |

The normalized value exists only while building the search statement. It is never persisted or substituted for curated labels.

## SearchResult

| Field | Shape | Rules |
|---|---|---|
| `entity_type` | `event \| person \| place \| state` | Determines selection behavior |
| `id` | UUID | Existing entity primary key |
| `slug` | string | Existing stable entity identity |
| `title_ar` | string | Original curated Arabic primary label |
| `title_en` | string or null | Original curated English primary label when available |
| `subtitle_ar` | string | Compact context derived from actual type/Event/Boundary data |
| `relevant_hijri_year` | integer | Existing start/valid-from year |
| `relevant_end_year` | integer or null | Existing end/valid-to year when meaningful |
| `coordinates` | object or null | Stored WGS84 longitude/latitude point context; never synthetic |
| `bounds` | object or null | Stored WGS84 extent bounds for Place area or State Boundary |
| `confidence` | string or null | Confidence belonging to the result or declared navigation context |
| `navigation_event_id` | UUID or null | Published Event selected as context for Event/Person/Place or State fallback |
| `navigation_event_slug` | string or null | Stable slug paired with the navigation Event id |

`coordinates` and `bounds` are mutually exclusive. Both may be null. The browser converts named longitude/latitude values to MapLibre's `[longitude, latitude]` order.

## NavigationContext

This is not a separate response object or stored record. It is the ranked published row that supplies `subtitle_ar`, relevant year, optional Event identity, and supported spatial hint.

### Event

- identity: the Event itself
- eligibility: `publication_status = published`
- time: start year and optional end year
- point: Event geometry point-on-surface, falling back to its primary Place point as used by the map engine
- confidence: Event confidence

### Person

- identity: Person canonical names and Person alias for matching
- eligibility: at least one published related Event
- context: one deterministic published Event; prefer an event whose stable slug contains the Person slug, then greater importance, supported point, earlier start year, and stable slug
- time/point: chosen Event context
- confidence: Person confidence

### Place

- identity: Place names only; `modern_reference` is excluded from search
- eligibility: at least one published related or primary-place Event
- context: highest-importance, then earliest published related Event
- time: chosen Event context
- point/bounds: Place's own stored point or area extent only
- confidence: null because Place has no confidence field

### State

- identity: State names only
- eligibility: at least one published related Event or published Boundary
- preferred context: earliest published Boundary by valid-from year and slug
- fallback context: highest-importance then earliest published related Event
- time/bounds: Boundary validity and WGS84 extent when present
- confidence: Boundary reconstruction confidence when Boundary context is used; otherwise null

## Existing relationships used

```text
HistoricalEvent -> start/end HistoricalDate
HistoricalEvent -> primary Place / primary geometry
HistoricalEvent <-> Person through EventPerson
HistoricalEvent <-> Place through EventPlace
HistoricalEvent <-> State through EventState
State -> PoliticalBoundary -> valid-from/to HistoricalDate
```

No new lifecycle or persistence transition is introduced.
