# Index

Every page in this wiki. "Last verified" is the date of the live fetch. All 14 URLs returned HTTP 200.

| Page | URL | Source repo / path | Last verified | Provenance |
|---|---|---|---|---|
| [oaudrey.com landing page](Apex-Landing-Page.md) | https://oaudrey.com/ | `site/index.html`, `site/assistant.js`, `site/exposure-audit-checklist.pdf`, `site/robots.txt` | 2026-11-28 | live fetch + repo read |
| [oaudrey.com/apps](Apps-Directory.md) | https://oaudrey.com/apps | `site/apps/index.html` | 2026-11-28 | live fetch + repo read |
| [Peekabyss](Peekabyss.md) | https://oaudrey.com/peekabyss | not in this repo | 2026-11-28 | live fetch + repo read |
| [Peekabyss privacy policy](Peekabyss-Privacy.md) | https://oaudrey.com/peekabyss/privacy | not in this repo | 2026-11-28 | live fetch + repo read |
| [Peekabyss terms of service](Peekabyss-Terms.md) | https://oaudrey.com/peekabyss/terms | not in this repo | 2026-11-28 | live fetch + repo read |
| [Deck-to-Video Kit](Deck-to-Video-Kit.md) | https://deck-to-video.oaudrey.com | `docs/oaudrey-app-paths/worker.js` (host mapping); origin content lives in its own site | 2026-11-28 | live fetch + repo read |
| [Freedom Angel Corps](Freedom-Angel-Corps.md) | https://fac.oaudrey.com | `docs/oaudrey-app-paths/worker.js` (host mapping); origin content lives in its own site | 2026-11-28 | live fetch + repo read |
| [OpenAudrey](OpenAudrey.md) | https://oaudrey.com/openaudrey/ | `docs/oaudrey-pages/worker.js` (path on oaudrey.com); origin is the `openaudrey-site` Pages project; `openaudrey.oaudrey.com` 301-redirects here | 2026-11-28 | live fetch + repo read |
| [EcoAnchor](EcoAnchor.md) | https://ecoanchor.oaudrey.com | `docs/oaudrey-app-paths/worker.js` (host mapping); origin content lives in its own site | 2026-11-28 | live fetch + repo read |
| [Sakura Property Scout](Sakura-Property-Scout.md) | https://sakura.oaudrey.com | `docs/oaudrey-app-paths/worker.js` (host mapping); origin content lives in its own site | 2026-11-28 | live fetch + repo read |
| [Project Face](Project-Face.md) | https://project-face.oaudrey.com | `docs/oaudrey-app-paths/worker.js` (host mapping); origin content lives in its own site | 2026-11-28 | live fetch + repo read |
| [Meet Audrey Evans (Life Hub)](Meet-Audrey-Evans.md) | https://meetaudrey.oaudrey.com | `docs/oaudrey-app-paths/worker.js` (host mapping); origin content lives in its own site | 2026-11-28 | live fetch + repo read |
| [soul2bowl](soul2bowl.md) | https://soul2bowl.oaudrey.com | `docs/oaudrey-app-paths/worker.js` (host mapping); origin content lives in its own site | 2026-11-28 | live fetch + repo read |
| [Pretty Portions](Pretty-Portions.md) | https://pretty-portions.oaudrey.com | `docs/oaudrey-app-paths/worker.js` (host mapping); origin content lives in its own site | 2026-11-28 | live fetch + repo read |

## Source repo
All rows refer to <https://github.com/midnghtsapphire/oaudrey-pages>. Paths under `site/apps/` and `docs/` exist on branch `webforge/apps-tab` (PR #5) until that PR is merged; `site/index.html`, `site/assistant.js` and the checklist PDF are on `main`.

## Method
1. Each URL was fetched with `curl -L` on 2026-11-28; HTTP status, final URL, title, meta description and script tags were recorded.
2. Page text was read and summarized. Features were not tested.
3. Contact emails and tax identifiers shown on live pages were left out on purpose.
4. Related libraries checked first: `midnghtsapphire/revvel-standards` (rules followed: never delete, never force-push, PR not merged by the author, no tracking) and `midnghtsapphire/searchcrew-library` (holds the Linear A library and notebooks; nothing about these sites).

---
Verified 2026-11-28 (America/Denver) by live fetch. Provenance: text read from the live page and from this repository; nothing added from memory. — IndexRunner
