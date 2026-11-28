# oaudrey.com Apps tab — plan

- **Author:** WebForge
- **Date:** Friday, November 27, 2026, America/Denver
- **Audrey's request (2026-11-27, her words):** "i need all apps running off another tab on oaudrey.com"
- **This pass:** inventory what is actually live, propose free oaudrey.com paths or subdomains, and open a **draft** PR that adds an Apps nav item plus `/apps`. No live deploy, no DNS changes, no new Worker routes, no spend.

## What stays the same

- The apex landing page (Exposure audit / Global Fusion Digest) is kept as-is. The PR only adds a small header nav (Home, Apps).
- `robots.txt` stays `User-agent: * / Disallow: /` (search engines still asked not to index).
- Peekabyss stays on Worker `peekabyss-pages` at `oaudrey.com/peekabyss*`.
- Nothing is published until Audrey says yes and the PR is merged by someone other than the authoring agent.

## 1. Inventory (checked 2026-11-27, evening America/Denver)

HTTP checked with Cloudflare DNS-over-HTTPS and `curl --resolve` (the box resolver returns fake 198.18.x addresses). Cloudflare, Vercel, and Netlify were read-only.

### Live now (HTTP 200, real content)

| App | Current URL | Host | On oaudrey.com today? |
|---|---|---|---|
| Exposure audit / Global Fusion Digest | https://oaudrey.com/ (www redirects here) | Cloudflare Worker `oaudrey-pages` | Yes — the apex, leave in place |
| Peekabyss (home, privacy, terms) | https://oaudrey.com/peekabyss | Cloudflare Worker `peekabyss-pages` | Yes |
| Freedom Angel Corps | https://freedomangelcorps.com/ (www redirects here) | Cloudflare Worker `freedomangelcorps-site` | No |
| OpenAudrey | https://midnghtsapphire.github.io/openaudrey/ | GitHub Pages | No |
| EcoAnchor | https://midnghtsapphire.github.io/eco-anchor-site/ | GitHub Pages | No |
| Sakura Property Scout | https://midnghtsapphire.github.io/Sakura_Property_Scout/ | GitHub Pages | No |
| Project Face | https://midnghtsapphire.github.io/project-face/ | GitHub Pages | No |
| Meet Audrey Evans — Life Hub | https://midnghtsapphire.github.io/meetaudreyevans-website/ | GitHub Pages | No |
| Audrey Evans — App Hub | https://midnghtsapphire.github.io/Meetaudreyevans/ | GitHub Pages | No |
| soul2bowl | https://midnghtsapphire.github.io/soul2bowl/ | GitHub Pages | No |
| Pretty Portions | https://strong-pegasus-b17dd2.netlify.app/ | Netlify (auto-generated name) | No |

### Live but not a finished app (shown as Coming soon unless Audrey says otherwise)

| Name | Current URL | Status |
|---|---|---|
| Rising Aloha | https://risingaloha.com/ | HTTP 200, Squarespace “Coming Soon” only |

### Flagged — do not list on the public page until Audrey says yes

| Name | URL | Why it is flagged |
|---|---|---|
| Deck-to-Video Kit | https://deck2vid-fenbmfwl.manus.space/ | HTTP 200, but hosted on Manus; Audrey previously had Manus inject tracking/affiliate/branding |
| GitHub Free Toolkit (Gumroad) | https://angelreporter.gumroad.com/l/fpxeyn | HTTP 200, a store listing, not an app she hosts |

### Not deployed, parked, or broken (not linked on `/apps`)

| Name | What I found | Proposed later home |
|---|---|---|
| Affiliate Hub | No DNS for affiliate-hub.oaudrey.com. DigitalOcean app was never created | /affiliate-hub or affiliate-hub.oaudrey.com |
| AI Video Toolkit | Same — not created | /ai-video-toolkit or ai-video-toolkit.oaudrey.com |
| Screen Recorder Finder | Same — not created | /screen-recorder-finder or screen-recorder-finder.oaudrey.com |
| Audit site | Same — not created | /audit or audit.oaudrey.com |
| oaudrey-home (old DO plan) | Would have taken over the apex. Not created. Do not use this to replace the exposure-audit page | n/a — apex stays the audit landing |
| GrowlingEyes | growlingeyes.com is a GoDaddy `/lander` parking stub | growlingeyes.oaudrey.com or /growlingeyes |
| Reese Reviews | reesereviews.com TLS fails; GitHub Pages redirects to that broken host and returns 500 | reesereviews.oaudrey.com or /reese-reviews |
| Neurooz | neurooz.com points at GitHub Pages but the certificate does not match; neurooz.vercel.app is 402 DEPLOYMENT_DISABLED | neurooz.oaudrey.com or /neurooz |
| MindMappr | mind-mappr.com zone is active but has only email MX/SPF, no website records | mindmappr.oaudrey.com or /mindmappr |
| Sessiono | sessiono.com is a Namecheap parking page | sessiono.oaudrey.com or /sessiono |
| OpenAudrey .com | openaudrey.com resolves to AWS IPs; TLS was unreliable in this check | keep GitHub Pages URL until a path is attached |
| Meet Audrey Evans .com | meetaudreyevans.com is NXDOMAIN | /meetaudrey or meetaudrey.oaudrey.com later |
| Uprising Hope | uprisinghope.com is a `/lander` parking stub (domain had been set to expire 2026-11-12) | only if she still wants the brand |
| agentintruder.com, stopagentic.com | TLS errors; no working site | later, if she wants them |
| Vercel `revvel-standards`, `soul2bowl`, `neurooz` | All return **402 DEPLOYMENT_DISABLED** | do not re-enable without her yes (billing) |
| Cloudflare Pages `demo-gitleaks.pages.dev` | HTTP 522; no production deployment | demo only, skip |
| Other Netlify projects (`wondrous-nasturtium-482053`, `unique-heliotrope-839b3d`) | HTTP 404 | skip |
| Worker `gdelt-proxy` | workers.dev returns 401; not a public app | skip |
| `oaudrey-pages` / `peekabyss-pages` on `*.growlingeyes.workers.dev` | HTTP 404 (those Workers are attached to oaudrey.com routes, not workers.dev) | do not advertise |

DigitalOcean: no App Platform apps exist. Earlier specs in `/workspace/webforge/do-specs/` were never applied. Cost if they were created later: about **$12/month each** on `apps-s-1vcpu-1gb` (three product apps ≈ $36/month, plus oaudrey-home $12 if anyone revived that plan). Not required for this tab.

## 2. Proposed oaudrey.com routes (all $0 on the current Cloudflare Free plan)

Recommendation: **use paths first** (same pattern as `/peekabyss`). Paths do not need new DNS records. Subdomains need a DNS record plus a Worker custom domain or Pages custom domain; still $0 on the Free plan, but they are a DNS change and need Audrey's yes.

The `/apps` page itself needs **no new route**. It can be served by the existing catch-all Worker `oaudrey-pages` (`oaudrey.com/*`) once this PR is merged and that Worker is updated. `/apps` currently 404s.

| App | Proposed path (preferred) | Optional subdomain | How to route later (still $0, after her yes) |
|---|---|---|---|
| Apps directory | **/apps** (this PR) | — | Already covered by `oaudrey.com/*` → `oaudrey-pages` |
| Exposure audit | `/` (unchanged) | — | Already live |
| Peekabyss | **/peekabyss** (already live) | peekabyss.oaudrey.com | Already routed to Worker `peekabyss-pages` |
| Freedom Angel Corps | /freedomangelcorps (or leave on its own domain and only link out) | fac.oaudrey.com | New, more-specific Worker route or custom domain on `freedomangelcorps-site`. Keep freedomangelcorps.com as the canonical company site unless she wants a 301 |
| OpenAudrey | /openaudrey | openaudrey.oaudrey.com | More-specific Worker route that serves or proxies the existing GitHub Pages site, or add a static copy under `oaudrey-pages` |
| EcoAnchor | /ecoanchor | ecoanchor.oaudrey.com | Same |
| Sakura Property Scout | /sakura | sakura.oaudrey.com | Same |
| Project Face | /project-face | project-face.oaudrey.com | Same |
| Meet Audrey (pick one canonical page first) | /meetaudrey | meetaudrey.oaudrey.com | Same; meetaudreyevans.com is NXDOMAIN today |
| soul2bowl | /soul2bowl | soul2bowl.oaudrey.com | Same |
| Pretty Portions | /pretty-portions | pretty-portions.oaudrey.com | Same, or a Cloudflare Pages custom domain on the existing Netlify site after a move. Retire the random `strong-pegasus-b17dd2.netlify.app` hostname once a path is live |
| Rising Aloha | leave on risingaloha.com until the real site exists | risingaloha.oaudrey.com only if she wants it under the portfolio | Optional; it is a separate brand |
| Affiliate Hub, AI Video Toolkit, Screen Recorder Finder, Audit | /affiliate-hub, /ai-video-toolkit, /screen-recorder-finder, /audit | matching subdomains | Only after a **free** host exists (Cloudflare Worker or Pages). Do **not** create DigitalOcean apps for this. |

No SSL-for-SaaS / custom hostname quota is needed if we use ordinary zone DNS + Worker routes or Pages custom domains on a zone Audrey already has.

## 3. Cost

| Item | Cost |
|---|---|
| This draft PR, the `/apps` page, and the nav link | **$0** |
| Serving `/apps` from the existing `oaudrey-pages` Worker after a later deploy | **$0** (Cloudflare Free) |
| Later path or subdomain routes for static apps, after Audrey's yes | **$0** (Worker route or Pages custom domain; subdomain needs a DNS record she approves) |
| Creating the planned DigitalOcean App Platform apps | **About $12/month each** — not needed for this tab; do not create them for it |
| Re-enabling Vercel projects that now return 402 | Unknown / likely a billing change — do not do this unless Proofy vets it and Audrey says yes |
| Paid GitHub | **Do not use.** GitHub Actions on her account has been billing-locked (`startup_failure`) since about Nov 12. The repo's deploy workflow (`.github/workflows/pages.yml`) runs only on push to `main` and may not actually update production (see below). |

### Deploy caveat (important, no action in this PR)

Live oaudrey.com is Worker **`oaudrey-pages`**, last modified 2026-11-20. The GitHub workflow deploys to a Cloudflare **Pages** project named `oaudrey-site`. A read of Pages projects in this account showed only `demo-gitleaks`, not `oaudrey-site`. So merging this PR to `main` may **not** automatically update the live Worker, especially with Actions billing-locked. After Audrey approves going live, deploy should be a free Wrangler publish of the `site/` folder to Worker `oaudrey-pages` (or a confirmed Pages project), done only with her yes. This PR does not deploy.

## 4. What the draft PR contains

Repo: `midnghtsapphire/oaudrey-pages`, branch `webforge/apps-tab`.

- New page `site/apps/index.html` — Apps directory, same look as the landing page (dark theme, system fonts, no tracking, no WebForge branding).
- Live apps are linked to URLs that work today. Planned or broken apps are a “Coming soon” list with no broken links.
- A Home / Apps nav is added to the existing header on the landing page and on `/apps`. Landing-page copy, pricing, schema, checklist link, `assistant.js`, and `robots.txt` are not rewritten.
- This plan is also in the PR body and in `docs/apps-tab-plan-2026-11-27.md` (repo root `docs/`, not under `site/`, so it is not published on the website).

## 5. Questions for Audrey

1. Which of the live sites should appear on the Apps tab? The draft lists Peekabyss, Freedom Angel Corps, OpenAudrey, EcoAnchor, Sakura Property Scout, Project Face, both Meet Audrey pages, soul2bowl, and Pretty Portions, plus the exposure audit as “this site.”
2. There are two Meet Audrey pages (Life Hub and App Hub). Which one should be listed, or both?
3. Should Rising Aloha stay off the list until the Squarespace “Coming Soon” is replaced, or appear as coming soon?
4. Should the Deck-to-Video Kit (Manus) or the Gumroad toolkit be listed?
5. For apps still on github.io or a random Netlify name, do you want them moved under oaudrey.com paths later (free, after a separate yes), or is linking out from `/apps` enough for now?
6. Paths or subdomains for those later moves? Paths are recommended because they need no DNS change.
7. May this draft PR be merged and the `/apps` page published? Nothing will go live until you say yes.

---

## Update 2026-11-28 (WebForge): approved, deployed, subdomains added

### Audrey's approvals (2026-11-28, her words, verified in her answer cards)
1. "Yes, put the Apps tab live". 2. "Keep all the sites on the list". 3. Meet Audrey: she skipped it, so one page is shown. 4. "Show Rising Aloha as coming soon". 5. "Yes, add the Deck-to-Video Kit and Gumroad toolkit". 6. "Yes, move each site to its own oaudrey.com address" (free only). Then: "Do sub domains off oaudrey now i need slavery sellable product up now", and "Put the Deck-to-Video Kit up first".
She asked for subdomains (not paths), so paths in section 2 above were replaced by subdomains below.

### Live
| Address | Origin it serves | Status |
|---|---|---|
| https://oaudrey.com/apps | Worker `oaudrey-pages` (pinned to this PR's commit) | 200 |
| https://deck-to-video.oaudrey.com/ | Deck-to-Video Kit page on Manus hosting (see notes) | 200, first product up |
| https://fac.oaudrey.com/ | freedomangelcorps.com | 200 |
| https://openaudrey.oaudrey.com/ | github.io/openaudrey | 200 |
| https://ecoanchor.oaudrey.com/ | github.io/eco-anchor-site | 200 |
| https://sakura.oaudrey.com/ | github.io/Sakura_Property_Scout | 200 |
| https://project-face.oaudrey.com/project-face/ | github.io/project-face (single-page app that needs its `/project-face/` base path; `/` redirects there) | 200 |
| https://meetaudrey.oaudrey.com/ | github.io/meetaudreyevans-website ("Life Hub") | 200 |
| https://soul2bowl.oaudrey.com/ | github.io/soul2bowl | 200 |
| https://pretty-portions.oaudrey.com/ | Netlify site (see notes) | 200 |

Every subdomain was opened in headless Chromium: page, CSS and scripts load, no failed requests except an optional `checkout.json` on the Deck page (404 by design).

### How it works ($0)
- One new Worker, `oaudrey-app-paths` (source: `/workspace/webforge/oaudrey-app-paths/worker.js`), reverse-proxies each subdomain to its origin. GET/HEAD only, no cookies, no analytics. Tracking scripts found in an origin page (Manus analytics, Plausible, Manus editor badge) are removed from the proxied copy. Cloudflare's own Web Analytics beacon is switched off for these pages with `Cache-Control: no-transform`.
- Each subdomain is a Worker custom domain on the free plan. Cloudflare added one new proxied DNS record per hostname. No existing DNS record, route or Worker was changed.
- `robots.txt` on every subdomain is `Disallow: /`, the same as oaudrey.com, until Audrey opens the site to search.
- The apex Worker `oaudrey-pages` keeps serving the same files. Only its source was repointed from `main` to this PR's commit SHA so `/apps` and the Home/Apps nav appear without merging. Everything else (www redirect, `/lander` redirect, content types, headers, `/peekabyss*` routes) is unchanged.

### Link-outs (not proxied) and why
- **GitHub Free Toolkit** (https://angelreporter.gumroad.com/l/fpxeyn): a Gumroad store page and checkout; Gumroad should stay on its own domain.
- **Rising Aloha**: shown as "coming soon" per Audrey; risingaloha.com is only a Squarespace placeholder.
- **Audrey Evans App Hub** (github.io/Meetaudreyevans/): not listed. Audrey skipped the choice, so only the Life Hub is shown; the App Hub is labelled "Testing Hub" on its own page. Add it later if she wants both.
- Still "coming soon" on `/apps`: Affiliate Hub, AI Video Toolkit, Screen Recorder Finder, Audit site, GrowlingEyes, Reese Reviews, Neurooz, MindMappr, Sessiono. No Vercel re-enabling, no DigitalOcean apps.

### Notes and risks for Audrey
- **Deck-to-Video Kit** has no hosted checkout yet. Its three buttons (Playbook $19, Full Kit $49, Done-for-you from $299) are `mailto:` order links to angelreporters@gmail.com, as published on the page itself. The video and preview images are served from Manus's storage, so they depend on that Manus site staying up. A copy of the page and media in Audrey's own repo would remove that dependency.
- **Pretty Portions** on Netlify serves its page as `text/plain`, so a browser shows raw HTML there. The oaudrey subdomain serves it correctly as HTML.
- **Cloudflare Web Analytics** is switched on for the whole oaudrey.com zone (and freedomangelcorps.com): Cloudflare injects a beacon into pages, including the apex and Peekabyss, which say "no tracking". It is a zone setting, not something these PRs added, so it was left alone. Audrey should decide whether to turn it off.
- Origins are other people's hosting (GitHub Pages, Netlify, Manus). If one of those repos goes private or is deleted, its subdomain stops working.

### Rollback
- Backups: `/workspace/webforge/backup-oaudrey-pages-2026-11-28/` (previous `oaudrey-pages` Worker source and settings, all 13 DNS records, routes and domains before this work).
- Subdomain: delete its custom domain under Workers > `oaudrey-app-paths` > Domains & Routes (its DNS record goes with it).
- Apex: re-upload `oaudrey-pages.worker.js` from the backup folder.

### Update 2026-11-28, 10:22 AM America/Denver: visitor counter on all sites

Audrey chose "Turn on Cloudflare's visitor counter on all the sites" (answer: "Both"). The opt-out (`Cache-Control: no-transform`) on Worker `oaudrey-app-paths` was removed, so the zone's free, cookieless Cloudflare Web Analytics beacon is injected on the nine subdomains the same way it already is on oaudrey.com and Peekabyss. No other tracking was added. Payment buttons were not changed. Redeployed 2026-11-28 10:22 AM America/Denver. Verified: each subdomain and the apex return the `cloudflareinsights.com` beacon once, and no Manus, Plausible, gtag or similar scripts.

### Update 2026-11-28, mid-morning America/Denver: search engines and Kit media

Audrey said "Yes, let Google list my sites" and "Yes, copy the Kit's media off Manus" (2026-11-28).

- `site/robots.txt` is now `Allow: /` with a sitemap at `https://oaudrey.com/sitemap.xml`. The same allow policy is served on each app subdomain (`/robots.txt` and `/sitemap.xml` from Worker `oaudrey-app-paths`). The Apps tab footer no longer says search engines are asked not to index the site.
- The Deck-to-Video video, four preview stills, share image and icons were copied off Manus/CloudFront into `media/deck-to-video/` (commit 31606300061e8ae1c6ff78a77ee1614575bbccab). Worker `oaudrey-app-paths` serves `/manus-storage/*` and the Kit `/assets/*` from that copy. The Open Graph image no longer points at files.manuscdn.com. Buy buttons were not changed.
- Backups: `/workspace/webforge/backup-deck-to-video-media-2026-11-28/`.
- Cloudflare's visitor counter stays on. A separate job will add Gumroad and PayPal checkout; the button HTML is still the proxied Manus page (see the PR comment).
