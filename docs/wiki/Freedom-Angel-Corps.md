# Freedom Angel Corps

| | |
|---|---|
| URL | <https://fac.oaudrey.com> |
| Live status (2026-11-28) | HTTP 200 |
| What it is | Company site; says Freedom Angel Corps is the parent company of Audrey Evans' ventures. |
| Served by | Cloudflare Worker `oaudrey-app-paths`, which reverse-proxies the origin below (source: [`docs/oaudrey-app-paths/worker.js`](https://github.com/midnghtsapphire/oaudrey-pages/blob/webforge/apps-tab/docs/oaudrey-app-paths/worker.js)) |
| Origin | https://freedomangelcorps.com (Cloudflare Worker `freedomangelcorps-site`) |

## What the page shows
- The page lists Home, Linear A, and White papers & research, and calls itself a Colorado corporation. It also says Angel Reporter is a Colorado DBA of Freedom Angel Corp.
- The page says there is no tracking, analytics or third-party scripts on the site.
- A contact email is shown on the live page and is intentionally not copied here.
- The page footer reads "Freedom Angel Corp, a Colorado corporation", while the Peekabyss pages say "Colorado nonprofit corporation". This wiki repeats each page as written and does not resolve the difference.

## Notes
- The Worker is GET/HEAD only, forwards no cookies, and serves `robots.txt` with `Disallow: /` (search engines asked not to index), per its source comments.
- Listed on [oaudrey.com/apps](Apps-Directory.md).

[Home](Home.md) · [Index](Index.md)

---
Verified 2026-11-28 (America/Denver) by live fetch. Provenance: text read from the live page and from this repository; nothing added from memory. — IndexRunner
