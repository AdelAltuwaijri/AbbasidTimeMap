# Historical Data Governance

## Principle
Historical truth in the application comes from **curated data with provenance**, not from the language model.

## Publication minimum
A public historical event requires:
- a title
- a temporal reference
- at least one supporting source
- summary written or reviewed against sources
- confidence classification

## Source categories
- primary/near-contemporary historical source
- later classical chronicle
- modern academic monograph
- peer-reviewed article
- scholarly encyclopedia/reference work
- institutional digital collection

## Confidence levels
### High
Multiple strong sources or well-established chronology.

### Medium
Generally accepted but with incomplete precision or limited source agreement.

### Disputed
Meaningful scholarly/source disagreement exists.

### Legendary / Late tradition
Narrative is historically important but factual status is weak or late.

## Disputed narratives
Do not collapse disputed accounts into one definitive statement.
Store:
- major versions
- source support
- editorial summary of disagreement

## Dates
Never invent exact month/day when only a year is supported.
Preserve approximation explicitly.

## Geography
Historical location uncertainty must be preserved.
A place can have:
- exact/strongly identified point
- approximate point
- region geometry
- unknown geometry

## Editorial separation
Maintain distinction between:
- verified factual record
- editorial explanation
- AI-generated explanation
- AI-generated reconstruction

## AI prohibition
AI output may not silently write to published historical tables.
AI-assisted ingestion must create draft content requiring review.

## Provenance
Every historical claim used in public details should be traceable to source records.
