# Corpus Import Contract

## Command

Run from `backend/`:

```text
python -m app.seeds.early_abbasid_corpus [--validate-only] [--manifest]
```

Default behavior validates the complete package, imports it atomically, and prints deterministic JSON.

## Successful result

```json
{
  "status": "imported",
  "counts": {
    "events": 0,
    "people": 0,
    "places": 0,
    "states": 0,
    "sources": 0,
    "event_types": 0
  }
}
```

`--validate-only` reports `status: "valid"` and performs no writes. `--manifest` also prints the recomputed manifest, which must match `data/seed/m01/manifest.json`.

## Failure behavior

- Exit code is non-zero and identifies the entity and failed rule.
- No database changes are committed.
- Invalid records are never silently skipped.

Mandatory failures: duplicate identifier, unknown event type, missing relationship target, published event without sources, inverted range, invalid geometry, malformed URL, and manifest drift.

## Idempotency

Repeated default runs converge to identical entity and relationship counts without replacing canonical UUID identity.

## Existing public interfaces

No new REST endpoint is introduced. Existing timeline queries return all active published events and only spatial events in `event_features`; existing event detail continues to expose sources. No response adds base-map labels or modern boundaries.
