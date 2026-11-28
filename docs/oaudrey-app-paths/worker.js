// oaudrey-app-paths (WebForge, 2026-11-28). Free Cloudflare Worker that serves Audrey's apps on
// <slug>.oaudrey.com by reverse-proxying the existing origin. Read-only proxy: GET/HEAD only,
// no cookies forwarded or set, no analytics. Third-party tracking scripts found in an origin page
// are stripped (Audrey's rule: no tracking, analytics or affiliate code, no outside branding).
// Rollback: remove the custom domain(s) for this Worker in Cloudflare (the DNS record goes with it).
// Add an app: add a row to APPS and attach <slug>.oaudrey.com as a Worker custom domain.
//   origin       scheme + host of the existing site
//   prefix       path on the origin where the app lives ('' if at the root)
//   keepPrefix   origin HTML uses absolute links such as /openaudrey/x: accept those paths as they are
//   home         optional redirect for '/' (SPA that needs its base path in the URL)
//   forceHtml    origin sends HTML as text/plain; serve it as text/html
const GH = 'https://midnghtsapphire.github.io';
const APPS = {
  'deck-to-video.oaudrey.com':    { origin: 'https://deck2vid-fenbmfwl.manus.space', prefix: '', block: ['/api/', '/sitemap.xml'] },
  'ecoanchor.oaudrey.com':        { origin: GH, prefix: '/eco-anchor-site' },
  'openaudrey.oaudrey.com':       { origin: GH, prefix: '/openaudrey', keepPrefix: true },
  'sakura.oaudrey.com':           { origin: GH, prefix: '/Sakura_Property_Scout' },
  'project-face.oaudrey.com':     { origin: GH, prefix: '/project-face', keepPrefix: true, home: '/project-face/' },
  'meetaudrey.oaudrey.com':       { origin: GH, prefix: '/meetaudreyevans-website' },
  'soul2bowl.oaudrey.com':        { origin: GH, prefix: '/soul2bowl', keepPrefix: true },
  'pretty-portions.oaudrey.com':  { origin: 'https://strong-pegasus-b17dd2.netlify.app', prefix: '', forceHtml: true },
  'fac.oaudrey.com':              { origin: 'https://freedomangelcorps.com', prefix: '' },
};
const STRIP_SRC = /<script\b[^>]*\bsrc\s*=\s*["'][^"']*(manus-analytics\.com|plausible\.io|manus-space-dispatcher|amplitude|googletagmanager|google-analytics|facebook\.net|hotjar|clarity\.ms)[^"']*["'][^>]*>\s*<\/script>/gi;
const STRIP_INLINE = /<script\b(?![^>]*\bsrc\s*=)[^>]*>(?:(?!<\/script>)[\s\S])*?(__manus_space_editor_info|__manus__global_env|window\.plausible|plausible\(|gtag\(|fbq\(|dataLayer|amplitude)(?:(?!<\/script>)[\s\S])*?<\/script>/gi;
const ROBOTS = 'User-agent: *\nDisallow: /\n'; // same policy as oaudrey.com until Audrey opens search
const text = (s, status = 404) => new Response(s, { status, headers: { 'content-type': 'text/plain' } });
export default {
  async fetch(req) {
    const u = new URL(req.url);
    const app = APPS[u.hostname];
    if (!app) return text('Not found');
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
    if (u.pathname === '/robots.txt') return new Response(ROBOTS, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' } });
    if ((app.block || []).some(p => u.pathname.startsWith(p))) return text('Not found');
    if (app.home && u.pathname === '/') return Response.redirect('https://' + u.hostname + app.home + u.search, 302);
    let path = u.pathname;
    const p = app.prefix;
    if (p && !(app.keepPrefix && (path === p || path.startsWith(p + '/')))) path = p + path;
    const target = app.origin + path + u.search;
    const h = new Headers();
    for (const k of ['range', 'accept', 'accept-encoding', 'if-none-match', 'if-modified-since', 'accept-language']) { const v = req.headers.get(k); if (v) h.set(k, v); }
    h.set('user-agent', 'Mozilla/5.0 (compatible; oaudrey-app-paths)');
    const r = await fetch(target, { method: req.method, headers: h, redirect: 'manual' });
    const publicBase = 'https://' + u.hostname;
    const toPublic = s => (s.startsWith(app.origin + p) ? publicBase + (app.keepPrefix ? p : "") + s.slice((app.origin + p).length) : s.startsWith(app.origin) ? publicBase + s.slice(app.origin.length) : s);
    if (r.status >= 300 && r.status < 400) {
      let to = r.headers.get('location') || '/';
      if (to.startsWith('/')) to = (app.keepPrefix || !p || !to.startsWith(p)) ? to : to.slice(p.length) || '/';
      else to = toPublic(to);
      return new Response(null, { status: r.status, headers: { location: to } });
    }
    const out = new Headers();
    for (const k of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified', 'cache-control']) { const v = r.headers.get(k); if (v) out.set(k, v); }
    out.set('x-content-type-options', 'nosniff');
    out.set('referrer-policy', 'strict-origin-when-cross-origin');
    let ct = (r.headers.get('content-type') || '').toLowerCase();
    if (app.forceHtml && r.status === 200 && (u.pathname === '/' || u.pathname.endsWith('.html') || !u.pathname.includes('.'))) { out.set('content-type', 'text/html; charset=utf-8'); ct = 'text/html'; }
    if (ct.includes('text/html') && req.method === 'GET' && r.status === 200) {
      let html = await r.text();
      html = html.replace(STRIP_SRC, '').replace(STRIP_INLINE, '');
      // Point self-references (canonical, og:url) at the public host.
      html = html.split(app.origin + p + '/').join(publicBase + (app.keepPrefix ? p + '/' : '/'));
      html = html.split(app.origin + p).join(publicBase + (app.keepPrefix ? p : ''));
      if (!p) html = html.split(app.origin).join(publicBase);
      out.delete('content-length'); out.delete('etag'); out.delete('content-range');
      // no-transform stops Cloudflare's automatic Web Analytics beacon from being injected (no analytics rule).
      out.set('cache-control', 'public, max-age=300, no-transform');
      return new Response(html, { status: 200, headers: out });
    }
    return new Response(req.method === 'HEAD' ? null : r.body, { status: r.status, headers: out });
  },
};
