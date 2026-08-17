# Codex Execution Playbook

## Purpose
Codex is the implementation executor. Product scope and architecture are defined in these documents.

## Operating rules
1. Read `AGENTS.md` and relevant package documents before coding.
2. Execute **one roadmap package at a time** unless explicitly instructed otherwise.
3. Do not invent new business/product scope.
4. Do not replace the chosen core stack without explicit approval.
5. Prefer minimal, maintainable implementation over speculative abstractions.
6. Do not create AI-generated historical facts in seed data.
7. Historical seed records must include sources or remain draft/test fixtures.
8. Preserve Arabic RTL and correct Bidi behavior for English/code/numbers.
9. Every database schema change must have an Alembic migration.
10. Add/update tests for package-critical logic.
11. Never commit secrets.
12. Do not silently weaken acceptance criteria.

## Package workflow
For each package:
1. Inspect current repo state.
2. Read package goal and acceptance criteria.
3. Write a short execution plan.
4. Implement only package scope.
5. Run applicable lint/tests/build.
6. Report changed files.
7. Report test results.
8. Report known limitations.

## Commit guidance
Use meaningful package-oriented commits, for example:
- `feat(foundation): initialize frontend and backend`
- `feat(history): add historical event domain model`
- `feat(map): integrate MapLibre base map`
- `feat(timeline): synchronize selected year with map data`

## Stop conditions
Codex must stop and ask for direction if:
- implementation conflicts with documented decisions
- a required historical assumption has no source
- a requested change would materially alter architecture
- credentials/external paid services are required and not configured

## Definition of done for a package
- package acceptance criteria satisfied
- relevant tests pass
- no obvious broken build/lint state
- docs updated if behavior/architecture changed
- no unrelated scope included
