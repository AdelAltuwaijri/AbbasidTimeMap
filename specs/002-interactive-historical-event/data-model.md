# Data Model: First Interactive Historical Event (F-05)

## Existing schema used without migration

| Entity | Seeded record | Key relations / rules |
|---|---|---|
| HistoricalDate | 145 AH, year precision | Primary event date; Gregorian reference is display metadata from source-backed editorial text. |
| EventType | `city_founded` | Categorizes the event. |
| Place | Baghdad | Approximate WGS84 point and modern-reference disclosure. |
| HistoricalEvent | `founding-of-baghdad` | Published only after its source relationship exists; primary place and geometry are Baghdad. |
| Source | Kennedy’s *Encyclopaedia Iranica* article | Title, author, publication data, canonical URL, and note. |
| EventSource | Event-to-source row | Support type and citation locator note. |
| Person | Abū Jaʿfar al-Manṣūr | Linked with founder role. |
| State | Abbasid Caliphate | Linked as founding state. |

## Detail projection

The public event-detail projection reads only published events and includes: identifiers, Arabic/English titles, date labels and numeric Hijri range, optional documented Gregorian display, category, summary, importance, confidence, primary place, associated people/states, and structured source metadata. Missing slug maps to a 404 response.

## Invariants

- The seed is idempotent by unique slugs/codes and updates or reuses linked records.
- The event is visible only in 145 AH because it has a Hijri year-only start date and no end date.
- A published record must retain at least one event-source association.
