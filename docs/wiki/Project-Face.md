# Project Face

| | |
|---|---|
| URL | <https://project-face.oaudrey.com> |
| Live status (2026-11-28) | HTTP 200 (redirects to <https://project-face.oaudrey.com/project-face/>) |
| What it is | Titled "Project Face — AI Skin Analysis by GlowStarLabs"; the page meta description says it analyzes skin health and gives recommendations. |
| Served by | Cloudflare Worker `oaudrey-app-paths`, which reverse-proxies the origin below (source: [`docs/oaudrey-app-paths/worker.js`](https://github.com/midnghtsapphire/oaudrey-pages/blob/webforge/apps-tab/docs/oaudrey-app-paths/worker.js)) |
| Origin | https://midnghtsapphire.github.io/project-face (GitHub Pages) |

## What the page shows
- The root URL redirects (HTTP 302 handled by the Worker) to `/project-face/`.
- The page is a single-page app: its HTML body is empty until `/project-face/assets/index-*.js` runs, so features beyond the title and meta description were not verified.

## Notes
- The Worker is GET/HEAD only, forwards no cookies, and serves `robots.txt` with `Disallow: /` (search engines asked not to index), per its source comments.
- Listed on [oaudrey.com/apps](Apps-Directory.md).

[Home](Home.md) · [Index](Index.md)

---
Verified 2026-11-28 (America/Denver) by live fetch. Provenance: text read from the live page and from this repository; nothing added from memory. — IndexRunner
