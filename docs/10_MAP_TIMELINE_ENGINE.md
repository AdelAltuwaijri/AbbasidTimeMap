# Map and Timeline Engine

## Core rule
The selected historical year controls the visible historical world.

## Inputs
- selected Hijri year
- visible layers
- optional event filter
- optional selected entity

## Derived state
For a selected year, the engine determines:
- active events
- active states
- valid political boundaries
- places relevant to active events
- people alive/active in the period
- current highlighted event

## Event temporal intersection
An event is active if its historical range intersects the selected year.
Exact-day events remain visible for their year at MVP granularity.

## Boundary temporal validity
For each political state, choose the boundary record whose validity range includes the selected year.
Never display a modern boundary as a substitute unless explicitly marked as a modern reference overlay.

## Timeline interactions
- click/drag year selector
- previous/next year
- play
- pause
- speed later
- event tick click jumps to event year

## Map reactions to year change
1. update political boundary source/layer
2. update event features
3. update place highlights
4. preserve camera when reasonable
5. if change originated from search/event selection, animate to target

## Selection behavior
Selecting an event:
- highlights marker/geometry
- opens event drawer
- may jump timeline to event date if not already there
- may fly map to event location

## Layer behavior
Layer toggles change rendering only; they do not alter historical year state.

## Playback
Playback is deterministic and stops at data/corpus limits unless the full range is available.
No AI-generated events may appear during playback.

## GeoJSON feature properties
Recommended minimum:
- id
- slug
- title_ar
- entity_type
- event_type
- year_start_hijri
- year_end_hijri
- importance
- confidence

## Performance rule
Large political geometries should be simplified for browser use. Preserve authoritative/high-resolution geometry separately if available.
