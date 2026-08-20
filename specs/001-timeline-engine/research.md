# Research: F-04 Timeline Engine

## Decisions

**Annual Hijri intersection**: Filter events using a Hijri start year on/before selection and a null or Hijri end year on/after selection. This preserves exact, approximate, and disputed annual Hijri chronology; Gregorian conversion is rejected.

**Summary versus GeoJSON**: Return all active event summaries, but only valid map points in GeoJSON. No-geometry events remain state without breaking mapping.

**Boundary filtering at source**: Join boundary validity dates and return only records containing the selected year. Client-side filtering and modern fallbacks are rejected.

**Local shared timeline state**: A reducer/hook inside the feature owns one selected year and playback state. A dependency is unnecessary and separate map time is rejected.
