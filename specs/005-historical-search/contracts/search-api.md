# Contract: Historical Search API

## Request

```http
GET /api/v1/search?q=%D8%A8%D8%BA%D8%AF%D8%A7%D8%AF&limit=10
Accept: application/json
```

| Parameter | Required | Validation |
|---|---|---|
| `q` | yes | 2–100 visible characters after trimming and search normalization |
| `limit` | no | integer 1–20; default 10 |

## Success response

```json
{
  "query": "بغداد",
  "results": [
    {
      "entity_type": "place",
      "id": "00000000-0000-0000-0000-000000000000",
      "slug": "baghdad",
      "title_ar": "بغداد",
      "title_en": "Baghdad",
      "subtitle_ar": "مكان — تأسيس بغداد، 145هـ",
      "relevant_hijri_year": 145,
      "relevant_end_year": null,
      "coordinates": {
        "longitude": 44.3661,
        "latitude": 33.3152
      },
      "bounds": null,
      "confidence": null,
      "navigation_event_id": "00000000-0000-0000-0000-000000000001",
      "navigation_event_slug": "founding-of-baghdad"
    }
  ]
}
```

### Field invariants

- `entity_type` is exactly `event`, `person`, `place`, or `state`.
- `title_ar`, `title_en`, and every slug are original stored values; normalization is not exposed as display text.
- `relevant_hijri_year` is always present and within the chosen stored Event or Boundary context.
- `coordinates`, when present, use named WGS84 longitude/latitude values.
- `bounds`, when present, use `{west, south, east, north}` and `west <= east`, `south <= north`.
- At most one of `coordinates` and `bounds` is present.
- `navigation_event_id` and `navigation_event_slug` are both present or both null.
- Event results identify themselves as the navigation Event. Person results identify the declared related published Event. Place and State results may carry an Event context but the browser does not open an Event drawer for those entity types.
- A State with Boundary context has `bounds`, no navigation Event, and `confidence` describing the Boundary reconstruction.
- Results are globally ranked and never exceed `limit`.

## Empty result

```json
{
  "query": "اسم غير موجود",
  "results": []
}
```

This is a successful `200` response, not an error.

## Validation failures

Missing, empty, too-short, too-long, normalized-empty queries and limits outside 1–20 return `422` using the existing FastAPI validation response. Search input is always supplied as a bound value; it is never interpolated into SQL text.

## Failure behavior

Unexpected database/service failure returns a non-success response. The frontend presents an Arabic search-only error and preserves the Timeline, map, layers, and current selection.

## Ranking contract

1. literal primary-label exact
2. normalized primary-label exact
3. normalized primary-label prefix
4. Person alias exact/prefix
5. normalized primary-label partial
6. Person alias partial
7. lower-priority stable slug matching

Ties are deterministic by match position, shorter normalized label, entity type, relevant year, and slug.
