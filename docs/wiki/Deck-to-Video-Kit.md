# Deck-to-Video Kit

| | |
|---|---|
| URL | <https://deck-to-video.oaudrey.com> |
| Live status (2026-11-28) | HTTP 200 |
| What it is | Product page for a playbook and production kit for turning a slide deck into a 30-second AI video. |
| Served by | Cloudflare Worker `oaudrey-app-paths`, which reverse-proxies the origin below (source: [`docs/oaudrey-app-paths/worker.js`](https://github.com/midnghtsapphire/oaudrey-pages/blob/webforge/apps-tab/docs/oaudrey-app-paths/worker.js)) |
| Origin | https://deck2vid-fenbmfwl.manus.space (Manus-hosted site) |

## What the page shows
- Three tiers shown on the page: Playbook ($19), Full Kit ($49) and Done for you ($299). Prices as shown on 2026-11-28.
- The page says it uses two AI clips, one original score and type drawn in post; it names Seedance 2.5 as the model used in the worked example.
- The page footer says a 30-day refund applies to digital products.
- The served HTML has no `<script src>` tags. It requests fonts from Google Fonts and cdnfonts and an image from Manus storage. The Worker source says it strips known analytics scripts and blocks `/api/` and `/sitemap.xml` for this host.
- The plan doc flagged this site on 2026-11-27 because the Manus origin had previously injected tracking and branding; the proxy was added afterwards. Audrey approved listing on `/apps` on 2026-11-28 per `site/README.md`.

## Notes
- The Worker is GET/HEAD only, forwards no cookies, and serves `robots.txt` with `Disallow: /` (search engines asked not to index), per its source comments.
- Listed on [oaudrey.com/apps](Apps-Directory.md).

[Home](Home.md) · [Index](Index.md)

---
Verified 2026-11-28 (America/Denver) by live fetch. Provenance: text read from the live page and from this repository; nothing added from memory. — IndexRunner
