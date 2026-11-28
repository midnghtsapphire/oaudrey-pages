# OpenAudrey

| | |
|---|---|
| URL | <https://oaudrey.com/openaudrey/> |
| Live status (2026-11-28) | Served as a tab on oaudrey.com. The previous address, https://openaudrey.oaudrey.com, 301-redirects here and is not deleted. |
| What it is | A brand page titled "OpenAudrey", described as an umbrella brand identity for a business portfolio, with an architecture diagram and a five-agent orchestration description. |
| Served by | Cloudflare Worker `oaudrey-pages` (the same Worker that serves `/` and `/apps`), which reverse-proxies the Cloudflare Pages project `openaudrey-site` (`openaudrey-site.pages.dev`). Source: [`docs/oaudrey-pages/worker.js`](https://github.com/midnghtsapphire/oaudrey-pages/blob/main/docs/oaudrey-pages/worker.js). |
| Origin | https://openaudrey-site.pages.dev/openaudrey/ (built from `midnghtsapphire/openaudrey` main). GitHub Pages for that repo stays unpublished. |

## What the page shows
- The page reads like a project README (docs links, brand vibe, architecture diagram).
- It is listed in the oaudrey.com nav and footer, next to Apps and Wiki, and under "On oaudrey.com" at [/apps](Apps-Directory.md).
- Tax identifiers and server details are not published on the live pages. The Worker also redacts EIN-shaped strings and infrastructure details at the edge.

## Notes
- The Worker is GET/HEAD only and forwards no cookies. Cloudflare Web Analytics (free, cookie-free) is added at the zone level.
- Requests to https://openaudrey.oaudrey.com/* keep their path and 301-redirect to https://oaudrey.com/openaudrey/*.

[Home](Home.md) · [Index](Index.md)

---
Updated 2026-11-28 (America/Denver) when the site moved to oaudrey.com/openaudrey/. — IndexRunner
