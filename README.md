# Makinyx

The umbrella brand under which Mike Byosekumbuga's professional work (Bio) and product ventures
(TaskPilot, and whatever comes next) live and grow.

- **Live**: https://makinyx.com
- **Ventures**: https://bio.makinyx.com · https://taskpilot.makinyx.com

## Stack
Vanilla HTML5/CSS3, zero npm dependencies, hosted on Vercel. See `docs/2-TRD.md` for the full
technical requirements and `CLAUDE.md` for project conventions.

## Pre-Build documents
Full PRD, TRD, UI/UX, App Flow, Schema, and Implementation Plan live in `docs/1-PRD.md` through
`docs/6-PLAN.md`. Read the Implementation Plan before making changes — Phase 5 commits to
evolving this from a single-page hub into a multi-page site on a fixed timeline.

## Local development
```bash
# Static site — any local server works
python3 -m http.server 5500
```

## Deployment
Push to `main` — Vercel auto-deploys. CI runs Gitleaks + CodeQL + zizmor workflow lint before the
deploy is considered green.
