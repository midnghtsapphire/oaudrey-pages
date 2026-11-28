# soul2bowl

| | |
|---|---|
| URL | <https://soul2bowl.oaudrey.com> |
| Live status (2026-11-28) | HTTP 200 |
| What it is | Titled "soul2bowl | A local catering, meal planning, pickup food, sunday meal place based in Northern Colorado". |
| Served by | Cloudflare Worker `oaudrey-app-paths`, which reverse-proxies the origin below (source: [`docs/oaudrey-app-paths/worker.js`](https://github.com/midnghtsapphire/oaudrey-pages/blob/webforge/apps-tab/docs/oaudrey-app-paths/worker.js)) |
| Origin | https://midnghtsapphire.github.io/soul2bowl (GitHub Pages) |

## What the page shows
- Reachable, but the content served is a developer README (stack, routes, brand tokens, environment variable names), not a finished customer site. The routes it lists (`/menu`, `/order`, `/catering` and others) belong to a Next.js app and were not checked on this host.
- Matching `/apps` text describes it as local catering, meal planning and pickup food in Northern Colorado.
- Loads `anchor.min.js` from cdnjs (heading-link helper).

## Notes
- The Worker is GET/HEAD only, forwards no cookies, and serves `robots.txt` with `Disallow: /` (search engines asked not to index), per its source comments.
- Listed on [oaudrey.com/apps](Apps-Directory.md).

[Home](Home.md) · [Index](Index.md)

---
Verified 2026-11-28 (America/Denver) by live fetch. Provenance: text read from the live page and from this repository; nothing added from memory. — IndexRunner
