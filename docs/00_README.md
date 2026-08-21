# Abbasid TimeMap — Documentation Pack

## Purpose
This documentation pack is the execution baseline for **Abbasid TimeMap**, an interactive historical platform for exploring Abbasid history through synchronized time, geography, people, states, sources, and AI-assisted storytelling.

The documentation is written to let **Codex execute the project in defined packages** without inventing scope, architecture, historical rules, or product behavior.

## Product principle
The product is not a static history website. It is a **time-aware geographic historical engine** where selecting a year changes the visible political boundaries, events, people, places, routes, and historical context.

## Core stack
- Frontend: Next.js + TypeScript
- UI: React + Tailwind CSS
- Map: MapLibre GL JS
- Backend: Python + FastAPI
- Database: PostgreSQL + PostGIS
- API style: REST/JSON
- Historical source data: curated structured records with explicit source links and confidence levels
- AI: downstream interpretive layer only; never the source of historical truth

## Documentation map
1. `01_PRODUCT_VISION.md` — vision, audience, value proposition
2. `02_SCOPE_AND_MVP.md` — scope boundaries and MVP definition
3. `03_FUNCTIONAL_REQUIREMENTS.md` — functional requirements
4. `04_NON_FUNCTIONAL_REQUIREMENTS.md` — quality attributes
5. `05_INFORMATION_ARCHITECTURE_UX.md` — primary user journeys and page structure
6. `06_SYSTEM_ARCHITECTURE.md` — system/component architecture
7. `07_DOMAIN_MODEL.md` — domain entities and relationships
8. `08_DATABASE_SCHEMA.md` — logical database model
9. `09_API_SPEC.md` — first API contract
10. `10_MAP_TIMELINE_ENGINE.md` — timeline/map synchronization behavior
11. `11_HISTORICAL_DATA_GOVERNANCE.md` — sources, confidence, disputes, editorial rules
12. `12_AI_ARCHITECTURE_AND_GUARDRAILS.md` — AI features and factuality guardrails
13. `13_TEST_STRATEGY.md` — testing strategy
14. `14_SECURITY_PRIVACY.md` — security and privacy baseline
15. `15_DEVOPS_ENVIRONMENTS.md` — local/dev/prod environments
16. `16_ROADMAP_AND_MILESTONES.md` — delivery roadmap
17. `17_CODEX_EXECUTION_PLAYBOOK.md` — Codex operating rules and package execution
18. `18_ACCEPTANCE_CRITERIA.md` — measurable acceptance criteria
19. `19_SEED_DATA_PLAN.md` — initial Abbasid seed dataset
20. `20_UI_DESIGN_SYSTEM.md` — visual system and component rules
21. `21_DECISIONS_LOG.md` — architecture/product decisions
22. `22_POLITICAL_BOUNDARY_RECONSTRUCTION.md` — sourced method, periods, exclusions, and limitations for temporal political boundaries
23. `AGENTS.md` — concise instructions for Codex

## Execution rule
Codex must execute package-by-package from the roadmap. It must not expand scope or redesign core architecture without an explicit documented decision.
