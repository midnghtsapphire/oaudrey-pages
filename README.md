# oaudrey-pages

Source for the public oaudrey.com landing page (`site/`) and its documentation wiki (`docs/wiki/`). See [`site/README.md`](site/README.md) for the landing page itself.

## Wiki

Documentation of oaudrey.com and every site attached to it, verified against the live pages on 2026-11-28.

- Read it online: <https://wiki.oaudrey.com> (MkDocs build of `docs/wiki/`, served by the Cloudflare Pages project `oaudrey-wiki`; no GitHub-hosted Actions)
- Read it on GitHub: [`docs/wiki/Home.md`](docs/wiki/Home.md) and [`docs/wiki/Index.md`](docs/wiki/Index.md)
- Build it yourself: `pip install -r requirements-wiki.txt && ./build-wiki.sh` (output goes to `wiki-site/`, which is not committed)

The wiki has no analytics, no tracking and no affiliate links. Contact emails and tax identifiers shown on live pages are deliberately left out.

Deploy note: the Cloudflare API connector could not get a Pages asset-upload token, so the first deployment packs the built site into a single `_worker.js` with `scripts/gen-pages-worker.py`. A normal `wrangler pages deploy wiki-site --project-name oaudrey-wiki`, or a Pages git connection made in the Cloudflare dashboard, can replace it with no code changes.

## OpenAudrey site (Cloudflare Pages)

OpenAudrey is served at `https://oaudrey.com/openaudrey/` by the `oaudrey-pages` Worker (`docs/oaudrey-pages/worker.js`), which proxies the Cloudflare Pages project `openaudrey-site` (`openaudrey-site.pages.dev`). The previous address, `openaudrey.oaudrey.com`, is kept and 301-redirects to that path (handled in `docs/oaudrey-app-paths/worker.js`). The GitHub Pages copy of `midnghtsapphire/openaudrey` is unpublished on purpose (it showed a tax ID); do not re-enable it. The Worker still redacts tax-ID and server-detail patterns at the edge.

Build: `python3 scripts/build-openaudrey-site.py <openaudrey checkout> openaudrey-site` (needs `pandoc`; follows the repo's `_config.yml` exclude list, skips `docs/MANUS_HANDOFF.md`, and fails if the output contains an EIN-shaped string, an IP address, `127.0.0.1:3001` or the vault hostname). Then pack with `scripts/gen-pages-worker.py openaudrey-site <out>/_worker.js` and upload that as the only file of a Pages deployment, or use `wrangler pages deploy`.
