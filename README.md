# oaudrey-pages

Source for the public oaudrey.com landing page (`site/`) and its documentation wiki (`docs/wiki/`). See [`site/README.md`](site/README.md) for the landing page itself.

## Wiki

Documentation of oaudrey.com and every site attached to it, verified against the live pages on 2026-11-28.

- Read it online: <https://wiki.oaudrey.com> (MkDocs build of `docs/wiki/`, served by the Cloudflare Pages project `oaudrey-wiki`; no GitHub-hosted Actions)
- Read it on GitHub: [`docs/wiki/Home.md`](docs/wiki/Home.md) and [`docs/wiki/Index.md`](docs/wiki/Index.md)
- Build it yourself: `pip install -r requirements-wiki.txt && ./build-wiki.sh` (output goes to `wiki-site/`, which is not committed)

The wiki's own build has no analytics plugins, no tracking scripts and no affiliate links. The only analytics is Cloudflare Web Analytics (free, cookie-free), which Cloudflare adds at the zone level for oaudrey.com and its subdomains (Audrey approved this on 2026-11-28). Contact emails and tax identifiers shown on live pages are deliberately left out.

Deploy note: the Cloudflare API connector could not get a Pages asset-upload token, so the first deployment packs the built site into a single `_worker.js` with `scripts/gen-pages-worker.py`. A normal `wrangler pages deploy wiki-site --project-name oaudrey-wiki`, or a Pages git connection made in the Cloudflare dashboard, can replace it with no code changes.
