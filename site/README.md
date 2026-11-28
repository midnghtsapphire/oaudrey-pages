# oaudrey-pages

Public landing page for oaudrey.com. Deployed to Cloudflare Pages by GitHub Actions.

- `site/` — the static page, assistant and checklist
- `.github/workflows/pages.yml` — deploy on push to main
- Secrets required: `CLOUDFLARE_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

No tracking, no watermarks, no external dependencies.

- 2026-11-26 — Grok Bot (Epigraphy Pipeline): Person `sameAs` ORCID in `site/index.html` switched from 0009-0005-0663-7832 to 0009-0004-9108-3995, at Audrey Evans's request: "i would rather it point to my new one".

- 2026-11-27 — WebForge: Added an Apps directory at `site/apps/index.html` (`/apps`) and a Home / Apps nav on the landing page. Landing-page copy is unchanged. Draft PR only; not deployed.
- 2026-11-28 — WebForge: `/apps` now lists live products and sites on their own oaudrey.com subdomains (served by Worker `oaudrey-app-paths`, source in `docs/oaudrey-app-paths/`). Approved by Audrey 2026-11-28. Not merged by the author.
