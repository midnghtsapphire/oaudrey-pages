# Sakura Property Scout

| | |
|---|---|
| URL | <https://sakura.oaudrey.com> |
| Live status (2026-11-28) | HTTP 200 |
| What it is | A property-listing dashboard page: filters, a Properties list, a Grant Stack Finder and a list of acquisition rules. |
| Served by | Cloudflare Worker `oaudrey-app-paths`, which reverse-proxies the origin below (source: [`docs/oaudrey-app-paths/worker.js`](https://github.com/midnghtsapphire/oaudrey-pages/blob/webforge/apps-tab/docs/oaudrey-app-paths/worker.js)) |
| Origin | https://midnghtsapphire.github.io/Sakura_Property_Scout (GitHub Pages) |

## What the page shows
- The page says data comes from verified JSON snapshots (source of truth Neon) published to GitHub Pages.
- The initial HTML shows "Loading Neon-backed snapshots…"; the listings are filled in by in-page script, so this wiki did not read the listing data.
- No external scripts loaded.

## Notes
- The Worker is GET/HEAD only, forwards no cookies, and serves `robots.txt` with `Disallow: /` (search engines asked not to index), per its source comments.
- Listed on [oaudrey.com/apps](Apps-Directory.md).

[Home](Home.md) · [Index](Index.md)

---
Verified 2026-11-28 (America/Denver) by live fetch. Provenance: text read from the live page and from this repository; nothing added from memory. — IndexRunner
