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
Clicking a marker or selecting an Event/Person search context opens the same Event
Experience. It is a side drawer on larger screens and a scrollable bottom sheet on
mobile. It contains only populated, curated sections:

- title
- uncertainty-aware Hijri date and stored Gregorian reference
- event category
- summary
- causes
- consequences
- primary and related places
- related people and states
- source citations and support metadata
- importance and confidence explanation

Related people and states reuse Search's shared time/map navigation; they do not
open profile pages. Historical claims and citation cards remain visually distinct.
Internal editorial notes are never displayed. AI actions and reconstructions remain
future, separately labeled scope.

The surface provides semantic headings, a persistent accessible close control,
Escape dismissal, managed/contained focus, focus return where the initiating
control still exists, and internal scrolling. Closing preserves the year, camera,
and layers; changing to a year where the event is inactive closes it. Successfully
fetched details may be cached for the current client session.

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
