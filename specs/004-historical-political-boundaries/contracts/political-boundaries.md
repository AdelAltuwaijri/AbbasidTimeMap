# Contract: M-02 Political Boundaries

## Annual timeline response

`GET /api/v1/timeline/state?year_hijri={year}` retains the existing response and supplies a typed GeoJSON `boundaries` FeatureCollection.

Each feature has Polygon/MultiPolygon geometry and properties:

```json
{
  "boundary_slug": "abbasid-extent-144-154",
  "state_id": "uuid",
  "state_slug": "abbasid-caliphate",
  "state_name_ar": "الخلافة العباسية",
  "valid_from_hijri": 144,
  "valid_to_hijri": 154,
  "confidence": "medium",
  "spatial_precision": "approximate",
  "source_count": 3,
  "primary_source_title": "DABUYIDS",
  "primary_source_url": "https://…",
  "reconstruction_note_ar": "هذا المضلع إعادة بناء تقريبية…"
}
```

Rules:

- Validity is inclusive at both ends.
- Only `published` records appear.
- A year outside all records returns an empty FeatureCollection.
- Full citations are not repeated in the map response; the compact primary source is a disclosure aid, while all links remain stored relationally.
- Existing event summary and marker contracts do not change.

## Import command

```powershell
python -m app.seeds.historical_boundaries --validate-only
python -m app.seeds.historical_boundaries --manifest
python -m app.seeds.historical_boundaries
```

Successful validation/import prints deterministic JSON counts. Any field, source graph, temporal overlap, geometry, SRID, state, or publication failure returns a non-zero exit with an actionable record-specific error. Import is one transaction and repeated execution preserves canonical UUIDs and counts.

## Frontend rendering contract

- Boundary fill and outline are inserted before event and selected-event layers.
- Changing `boundaries` calls `setData` on the existing source.
- The independent boundary visibility preference controls both fill and outline and survives year changes.
- Clicking unobstructed boundary geometry may show concise Arabic state/period/confidence/precision/source disclosure; event-marker interaction takes precedence.
- The base style remains free of symbol and political-boundary layers.
