# OpenAudrey

| | |
|---|---|
| URL | <https://openaudrey.oaudrey.com> |
| Live status (2026-11-28) | HTTP 200 |
| What it is | A brand page titled "OpenAudrey", described as an umbrella brand identity for a business portfolio, with an architecture diagram and a five-agent orchestration description. |
| Served by | Cloudflare Worker `oaudrey-app-paths`, which reverse-proxies the origin below (source: [`docs/oaudrey-app-paths/worker.js`](https://github.com/midnghtsapphire/oaudrey-pages/blob/webforge/apps-tab/docs/oaudrey-app-paths/worker.js)) |
| Origin | https://midnghtsapphire.github.io/openaudrey (GitHub Pages) |

## What the page shows
- The page reads like a project README (docs links, brand vibe, architecture diagram).
- The page loads `anchor.min.js` from cdnjs (a heading-link helper, not an analytics script).
- The live page prints a federal tax ID and infrastructure details. They are intentionally not copied into this wiki. Whether that is meant to be public is a question for Audrey.

## Notes
- The Worker is GET/HEAD only, forwards no cookies, and serves `robots.txt` with `Disallow: /` (search engines asked not to index), per its source comments.
- Listed on [oaudrey.com/apps](Apps-Directory.md).

[Home](Home.md) · [Index](Index.md)

---
Verified 2026-11-28 (America/Denver) by live fetch. Provenance: text read from the live page and from this repository; nothing added from memory. — IndexRunner
