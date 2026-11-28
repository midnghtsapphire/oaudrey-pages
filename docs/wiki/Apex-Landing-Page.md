# oaudrey.com landing page

| | |
|---|---|
| URL | <https://oaudrey.com/> |
| Live status (2026-11-28) | HTTP 200 (final URL <https://oaudrey.com/>) |
| What it is | Global Fusion Digest page for a fixed-scope "exposure audit" for schools, clinics and small manufacturers. |
| Source in repo | `site/index.html`, `site/assistant.js`, `site/exposure-audit-checklist.pdf`, `site/robots.txt` (main branch) |

## What the page shows
- Page title: "Exposure audit for schools, clinics and small manufacturers | Global Fusion Digest".
- Offer as written on the page: a five-day exposure audit with ten phases, 59 controls scored 0 to 2, a findings register, a red-flag brief and a 30/60/90 plan, listed at $2,500. A leadership briefing ($1,500) and a ransomware readiness package ($4,000) are also listed. Prices are as shown on 2026-11-28 and may change.
- The page says it is built on the CISA Known Exploited Vulnerabilities catalog, CISA ICS advisories and FBI IC3 PSAs.
- Header nav links: Home, Apps. It loads one script, `assistant.js`, from the same site.
- Free checklist: `https://oaudrey.com/exposure-audit-checklist.pdf` returned HTTP 200 (application/pdf).
- `https://oaudrey.com/robots.txt` returned HTTP 200 and asks crawlers to stay out (`Disallow: /`).
- The page contains no analytics or tracking scripts in its HTML.

## Notes
Served by Cloudflare Worker `oaudrey-pages` (per `docs/apps-tab-plan-2026-11-27.md`). The repo deploy workflow targets a Cloudflare Pages project; the plan doc notes the two may not match.

[Home](Home.md) · [Index](Index.md)

---
Verified 2026-11-28 (America/Denver) by live fetch. Provenance: text read from the live page and from this repository; nothing added from memory. — IndexRunner
