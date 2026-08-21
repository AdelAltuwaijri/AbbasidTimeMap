# Phase 1 Data Model: Historical Event Experience

M-04 introduces no persistence model. It defines a public read projection over
existing historical tables and a transient client state.

## Public Event Detail projection

| Field | Source | Rules |
|---|---|---|
| `id`, `slug`, `title_ar`, `title_en` | `historical_events` | Published/source-proven event only |
| `start_date`, `end_date` | `historical_dates` | Preserve calendar, year/month/day, precision, circa, and stored labels |
| compatibility date fields | derived from structured dates | Retained for current clients; never add precision |
| `event_type` | `event_types` | Stored identity and Arabic/English names |
| `summary_ar`, `summary_en` | `historical_events` | Stored values only |
| `causes_ar`, `consequences_ar` | `historical_events` | Optional; never inferred |
| `importance`, `confidence` | `historical_events` | Raw stored values; Arabic explanation is presentation logic |
| `primary_place` | `places` | Optional stored relation; no synthesized point |
| `related_people` | `event_people` + `people` | Distinct identity plus `role_code` |
| `related_places` | `event_places` + `places` | Distinct identity plus `relation_type`; primary place is not duplicated |
| `related_states` | `event_states` + `states` | Distinct identity plus `relation_type` |
| `sources` | `event_sources` + `sources` | Distinct by source id; citation/support/reliability fields preserved |

### Structured date

```text
HistoricalDateDetail
├── calendar: string
├── year: integer
├── month: integer | null
├── day: integer | null
├── precision: string
├── circa: boolean
├── display_label_ar: string | null
└── display_label_en: string | null
```

`end_date` is null for a single endpoint. A range can carry different precision
and circa values at each endpoint.

### Related historical entity

Every related person/place/state contains stable `id`, `slug`, Arabic/English
names, and the relationship metadata stored on its association row. No profile,
biography, modern geography, or generated description is part of this projection.

### Source citation

Source identity and bibliographic data are combined with event-specific metadata:

```text
EventSourceDetail
├── id, source_type, title, author
├── edition, publication_data
├── citation_locator
├── support_type
├── reliability_note
└── url: http(s) URL | null
```

`Source.notes` is excluded. Invalid or non-http(s) URLs become null. Cards are
deduplicated by source id, never merely by title.

## Publication state transition

```text
draft/reviewed/archived ──────────── public GET ──> 404
published without source ─────────── public GET ──> 404
published without confidence ─────── public GET ──> 404
published with source + confidence ─ public GET ──> EventDetail
```

## Client Event Experience state

```text
EventExperienceState
├── target slug + initiating focus reference
├── detail: idle | loading | ready | error
├── selected marker slug (existing map state)
├── request sequence / AbortController
├── related-navigation status
└── cache: Map<slug, EventDetail> (successful responses only)
```

The state does not own a year, boundary, camera, or layer visibility. Those remain
in the established Timeline/Map workspace.
