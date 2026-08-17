# Functional Requirements

## FR-01 Timeline
- Display Abbasid timeline beginning at 132 AH and ending at 656 AH.
- MVP may restrict interactive data coverage to 132–170 AH while retaining the full visual range if clearly marked.
- Allow selecting a year.
- Support play/pause automatic progression.
- Provide previous/next year navigation.
- Provide optional event ticks on the timeline.

## FR-02 Historical map
- Map must synchronize to selected year.
- Display time-valid political boundaries.
- Display event markers occurring in or intersecting the selected year.
- Display relevant cities and places.
- Layer visibility can be toggled.

## FR-03 Event exploration
Each event can include:
- Arabic title
- English title optional
- event type
- date/range
- location(s)
- summary
- causes
- consequences
- importance level
- confidence level
- involved people
- involved states/dynasties
- sources

## FR-04 Date model
Support:
- exact date
- year-only date
- approximate date
- date range
- disputed date
- Hijri date
- Gregorian equivalent when known/calculated

## FR-05 People
A person record may include:
- names and aliases
- birth/death dates with precision
- roles
- places associated with life/activity
- related events
- fields of scholarship when applicable
- source references

## FR-06 Places
Support:
- cities
- settlements
- regions
- battle sites
- institutions
- geographic features
- historical names and modern labels

## FR-07 Political states
Support states/dynasties with:
- names
- valid time range
- relationships to Abbasid authority
- time-dependent geographic boundaries

## FR-08 Search
Search by:
- event
- person
- place
- dynasty/state
- year

## FR-09 Layer controls
Initial layers:
- political boundaries
- events
- battles
- caliphs/political events
- scholars
- scientific centers
- cities
- revolts
- independent states

## FR-10 Sources
Every publishable factual event must have at least one source reference.
The UI must distinguish source citation from AI-generated explanation.

## FR-11 Historical confidence
Supported values:
- high
- medium
- disputed
- legendary/late-tradition

## FR-12 Historical journeys
A journey is an ordered narrative composed of events/places/time points.
The map and timeline move automatically through journey steps.

## FR-13 Ask History — later milestone
Users may ask questions in natural Arabic.
The answer may produce:
- concise response
- cited supporting events
- time range
- map focus/route

## FR-14 AI reconstruction — later milestone
AI-generated images/video must be labeled as reconstructions and be based on structured verified event data.
