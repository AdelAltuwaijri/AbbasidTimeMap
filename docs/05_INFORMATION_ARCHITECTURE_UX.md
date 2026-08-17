# Information Architecture and UX

## Primary home experience
The home page is the product, not a marketing landing page.

### Main layout
1. Global header
2. Main timeline
3. Historical map
4. Layer control panel
5. Event detail drawer
6. Context panels below/around map

## Header
Contains:
- product identity
- Home
- Map
- Timeline/Chronology
- People
- Search
- language toggle later

## Timeline
Shows:
- establishment of Abbasid state
- current selected year
- fall of Baghdad / terminal Abbasid date depending corpus definition
- event clusters/ticks
- play/pause
- speed control later

## Historical map
The map is the central canvas.
It displays:
- political regions
- cities
- events
- movement/route lines when relevant
- highlighted selected event

## Event interaction
Clicking a marker opens a right-side drawer containing:
- title
- date
- event category
- image/reconstruction placeholder
- summary
- causes
- impact
- people
- sources
- confidence
- AI actions when enabled

## Layer panel
Persistent or collapsible.
Layer toggles must not change the underlying selected year.

## Bottom/context panels
Optional desktop modules:
- Abbasid pulse indicators
- notable people alive in this year
- what was happening elsewhere in the world
- recommended historical journeys

These are post-MVP unless explicitly assigned.

## Search behavior
Search results should navigate both **time and map**.
Example: selecting “Battle of the Zab” should set the timeline to the relevant date and move the map to the location.

## Empty states
If no mapped event exists in a selected year:
- retain political geography
- show nearby-year events
- do not fabricate content

## Visual direction
- dark cinematic interface
- gold/amber accents
- historical parchment/map texture used carefully
- high legibility over decorative authenticity
- Arabic typography suitable for dense informational interfaces
