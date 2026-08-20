# Research: First Interactive Historical Event (F-05)

## Historical record

- **Decision**: Seed the founding of Baghdad by al-Manṣūr in 145 AH / 762 CE.
- **Rationale**: Hugh Kennedy’s scholarly *Encyclopaedia Iranica* article explicitly records that Baghdad was founded in 145/762 by the second Abbasid caliph Abū Jaʿfar al-Manṣūr as the official capital. This is within 132–170 AH and provides a clear event, actor, place, year, and source trail.
- **Alternatives considered**: Battle of the Zab and the Abbasid proclamation were suitable chronologically, but Baghdad provides a highly legible named place and a direct city-founding relationship for the first end-to-end interaction.

## Provenance and precision

- **Decision**: Store the event with Hijri year precision, a documented Gregorian display “762 CE,” and `high` confidence. Store the point as a clearly annotated approximate modern Baghdad reference point.
- **Rationale**: The scholarly source supports 145/762 but not a month/day or archaeological coordinate. The database’s existing `citation_locator` stores an event-level provenance note, so the current schema is sufficient.
- **Alternatives considered**: Adding a page/locator column or claiming an exact Round City centre would add unsupported precision and is unnecessary for F-05.

## Detail and selection flow

- **Decision**: Fetch public event detail on marker selection; open a stable drawer shell immediately, focus the close control, then render loading, content, or retryable failure state.
- **Rationale**: The map stays intact, API failure is contained, and the selected marker remains synchronized with the known state.
- **Alternatives considered**: Embedding all event detail in timeline GeoJSON would duplicate detail data and make source content unavailable to a direct event URL.
