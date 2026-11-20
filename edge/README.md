# oaudrey.com edge deploy

Git-Master, 2026-11-19, on Audrey's yes ("Yes, put oaudrey-pages live on oaudrey.com").

- **What serves the site:** the Cloudflare Worker `oaudrey-pages` serves `site/` straight from this public repo's `main` branch, through raw.githubusercontent.com with a 5-minute cache. A push to `main` goes live within about 5 minutes. No GitHub Actions are involved, because Actions is billing-locked.
- **Routes:** Worker routes `oaudrey.com/*` and `www.oaudrey.com/*` on the oaudrey.com zone. `www` and the old GoDaddy `/lander` path both redirect to `https://oaudrey.com/` with a 301.
- **DNS:** unchanged. The proxied A records `15.197.148.33` and `3.33.130.190` (GoDaddy parking) are still in place but no longer reached, because the route catches requests first. MX, SPF, DKIM and DMARC records were not touched.
- **To undo:** delete the two Worker routes in Cloudflare. The domain then goes back to the GoDaddy parking page.
- **Note:** `site/robots.txt` currently says `Disallow: /`, so search engines won't index the site.

The source is in `worker.js`, an exact copy of what was deployed.
