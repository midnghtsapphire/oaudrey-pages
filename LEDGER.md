# Ledger

## 2026-11-19 — Git-Master — oaudrey.com edge deploy
- **Why:** oaudrey.com was showing GoDaddy parking, then a 525 error. Every earlier deploy path depended on GitHub Actions, which is billing-locked, and DigitalOcean had 0 apps and Cloudflare Pages had 0 projects.
- **Approval:** Audrey, in Git-Master chat, "Yes, put oaudrey-pages live on oaudrey.com".
- **What changed:** I uploaded the Worker `oaudrey-pages` and added routes `oaudrey.com/*` (id 4917349b…) and `www.oaudrey.com/*` (id 403a0d0d…). No DNS records were changed or deleted.
- **Verified:** `/` returns 200 with the site title, `www` and `/lander` return 301 to the apex, the PDF and JS return 200, and an unknown path returns 404.
- **Undo:** delete the two routes.
- **Open item:** robots.txt disallows all crawlers, so the owner should decide whether to keep that. — Git-Master
