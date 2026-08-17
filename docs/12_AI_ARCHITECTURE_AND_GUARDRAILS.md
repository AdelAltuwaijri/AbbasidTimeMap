# AI Architecture and Guardrails

## Role of AI
AI is an interpretation and experience layer, not the database of record.

## Allowed AI capabilities
Later milestones may include:
- simplify event explanation
- academic explanation
- child-friendly explanation
- answer historical questions from retrieved corpus
- generate narrated journey scripts
- generate reconstruction scene plans
- generate images/video based on fact packs

## Retrieval-first architecture
```text
User question
  -> retrieve relevant curated records
  -> build factual context pack
  -> generate answer
  -> attach source references
```

## Fact pack
AI context for an event should contain:
- verified date/range
- places
- people
- states
- summary
- causes/consequences
- disputes
- sources
- prohibited assumptions

## Reconstruction pipeline
```text
Historical records
 -> Fact Pack
 -> Scenario draft
 -> Scene plan
 -> Visual generation
 -> Narration
 -> Final reconstruction
```

## Required label
All generated visuals/videos must visibly state that they are **AI-assisted historical reconstructions**, not authentic footage.

## Hallucination controls
- do not provide unsupported exact quotes from historical figures
- do not invent architecture/costume details as facts
- separate “documented” from “plausible reconstruction”
- when evidence is disputed, present uncertainty

## Historical-character agents
If implemented later, responses must be labeled as simulations based on known historical material, not real quotations.

## AI persistence
Generated outputs may be cached, but must retain:
- model/provider metadata
- prompt/fact-pack version
- generation timestamp
- source event IDs
- moderation/review state when published
