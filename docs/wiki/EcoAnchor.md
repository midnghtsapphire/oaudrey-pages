# EcoAnchor

| | |
|---|---|
| URL | <https://ecoanchor.oaudrey.com> |
| Live status (2026-11-28) | HTTP 200 |
| What it is | "EcoAnchor Ground System": a product site for a modular anchoring system for fence posts, awnings and planters. |
| Served by | Cloudflare Worker `oaudrey-app-paths`, which reverse-proxies the origin below (source: [`docs/oaudrey-app-paths/worker.js`](https://github.com/midnghtsapphire/oaudrey-pages/blob/webforge/apps-tab/docs/oaudrey-app-paths/worker.js)) |
| Origin | https://midnghtsapphire.github.io/eco-anchor-site (GitHub Pages) |

## What the page shows
- The page lists materials: basalt fiber shell, volcanic ash or dirt filler, shredded Styrofoam or plastic, a biopolymer or PVA binder, and optional dried flowers.
- It links two PDF resources (screw size guide and flower contribution form); those links were not fetched for this wiki.
- Footer: © 2025 MacaLeaLea / Living Aloha Design Co. No scripts loaded.

## Notes
- The Worker is GET/HEAD only, forwards no cookies, and serves `robots.txt` with `Disallow: /` (search engines asked not to index), per its source comments.
- Listed on [oaudrey.com/apps](Apps-Directory.md).

[Home](Home.md) · [Index](Index.md)

---
Verified 2026-11-28 (America/Denver) by live fetch. Provenance: text read from the live page and from this repository; nothing added from memory. — IndexRunner
