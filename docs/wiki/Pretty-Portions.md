# Pretty Portions

| | |
|---|---|
| URL | <https://pretty-portions.oaudrey.com> |
| Live status (2026-11-28) | HTTP 200 |
| What it is | Landing page "Pretty Portions — Tiny Bites, Big Joy" for mini-portion food: a waitlist sign-up, a mold calorie calculator, weekly meal plans and mold kits. |
| Served by | Cloudflare Worker `oaudrey-app-paths`, which reverse-proxies the origin below (source: [`docs/oaudrey-app-paths/worker.js`](https://github.com/midnghtsapphire/oaudrey-pages/blob/webforge/apps-tab/docs/oaudrey-app-paths/worker.js)) |
| Origin | https://strong-pegasus-b17dd2.netlify.app (Netlify; the Worker forces the HTML content type) |

## What the page shows
- The waitlist form does not send the email anywhere: its script only logs to the browser console and shows a thank-you message (comment in the code: "In production, this would submit to your email service"). Anyone who signs up is not actually added to a list.
- The page describes a calculator, meal plans and mold kits; those features were not tested.
- No external scripts loaded.

## Notes
- The Worker is GET/HEAD only, forwards no cookies, and serves `robots.txt` with `Disallow: /` (search engines asked not to index), per its source comments.
- Listed on [oaudrey.com/apps](Apps-Directory.md).

[Home](Home.md) · [Index](Index.md)

---
Verified 2026-11-28 (America/Denver) by live fetch. Provenance: text read from the live page and from this repository; nothing added from memory. — IndexRunner
