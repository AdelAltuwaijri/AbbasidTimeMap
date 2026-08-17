# Security and Privacy Baseline

## MVP posture
The public MVP has low personal-data exposure, but basic web security standards still apply.

## Requirements
- secrets only in environment variables / secret manager
- no API keys in repository
- validate all API inputs
- ORM/query parameterization only
- secure dependency update process
- CORS restricted appropriately per environment
- production HTTPS
- security headers
- rate limiting for AI/search endpoints when needed

## Admin/editorial future
When editorial administration is introduced:
- authentication required
- role-based permissions
- audit history
- draft/review/publish separation

## AI security
- do not expose provider secrets to browser
- server-side AI calls only
- limit prompt injection impact by treating historical source content as data, not instructions

## Public input
If Ask History is enabled:
- enforce request limits
- moderate abusive requests where necessary
- log technical metadata without unnecessary sensitive content

## Privacy
Avoid collecting personal data unless a later feature needs it. Analytics should be privacy-conscious and documented.
