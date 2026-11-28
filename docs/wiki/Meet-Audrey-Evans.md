# Meet Audrey Evans (Life Hub)

| | |
|---|---|
| URL | <https://meetaudrey.oaudrey.com> |
| Live status (2026-11-28) | HTTP 200 |
| What it is | "MeetAudreyEvans.com — Life Hub": a hub page grouping music, data intelligence, tools and standards projects, each tagged with a status label such as Live, GitHub, Private or External. |
| Served by | Cloudflare Worker `oaudrey-app-paths`, which reverse-proxies the origin below (source: [`docs/oaudrey-app-paths/worker.js`](https://github.com/midnghtsapphire/oaudrey-pages/blob/webforge/apps-tab/docs/oaudrey-app-paths/worker.js)) |
| Origin | https://midnghtsapphire.github.io/meetaudreyevans-website (GitHub Pages) |

## What the page shows
- The page states counts such as 80+ projects and 12 categories; those are the page's claims and were not checked.
- The plan doc notes a second Audrey Evans hub (App Hub, `midnghtsapphire.github.io/Meetaudreyevans/`) that is not mapped to a subdomain; this wiki covers only the Life Hub URL.
- No external scripts loaded.

## Notes
- The Worker is GET/HEAD only, forwards no cookies, and serves `robots.txt` with `Disallow: /` (search engines asked not to index), per its source comments.
- Listed on [oaudrey.com/apps](Apps-Directory.md).

[Home](Home.md) · [Index](Index.md)

---
Verified 2026-11-28 (America/Denver) by live fetch. Provenance: text read from the live page and from this repository; nothing added from memory. — IndexRunner
