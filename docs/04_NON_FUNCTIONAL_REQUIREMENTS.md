# Non-Functional Requirements

## Performance
- Initial interactive page should become usable quickly on standard broadband.
- Map interactions should target smooth pan/zoom.
- Changing a year should avoid full page reload.
- Year-state API should support caching.
- GeoJSON payloads must be simplified appropriately for browser rendering.

## Accessibility
- Keyboard-accessible controls.
- Sufficient contrast.
- Text alternatives for meaningful imagery.
- Timeline operable without precision mouse control.
- Event information cannot rely solely on color.

## Localization and Bidi
- Arabic is the primary language.
- RTL layout is default.
- English names, coordinates, IDs, code-like values, years, and technical strings must preserve correct LTR display where necessary.
- Architecture must permit future English UI.

## Maintainability
- Clear frontend feature modules.
- Backend service/domain separation.
- Database migrations mandatory.
- No direct raw historical content hard-coded into UI components.

## Reliability
- Invalid or incomplete historical records must not crash map/timeline rendering.
- Missing geometry may fall back to text-only event display.

## Auditability
- Historical edits should preserve provenance.
- Sources and editor notes should be traceable.

## Extensibility
The architecture must support future historical corpora beyond the Abbasid period without rewriting the map/timeline engine.

## Browser support
Target current major desktop browsers first; responsive mobile web is required before public launch.
