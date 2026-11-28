// oaudrey-app-paths (WebForge, 2026-11-28). Free Cloudflare Worker that serves Audrey's apps on
// <slug>.oaudrey.com by reverse-proxying the existing origin. Read-only proxy: GET/HEAD only,
// no cookies forwarded or set. Third-party tracking scripts found in an origin page (Manus,
// Plausible, etc.) are stripped. Cloudflare's free, cookieless Web Analytics is allowed (Audrey,
// 2026-11-28: "Leave the Cloudflare visitor counter on" / "Both").
// Deck-to-Video video and images are served from midnghtsapphire/oaudrey-pages media/deck-to-video
// (commit 31606300061e8ae1c6ff78a77ee1614575bbccab), not from Manus storage. Buy buttons: /checkout.json plus HTMLRewriter hrefs point Playbook and Full Kit at Gumroad; Done-for-you stays mailto.
// Rollback: remove the custom domain(s) for this Worker (the DNS record goes with it).
const GH = 'https://midnghtsapphire.github.io';
const APPS = {
  'deck-to-video.oaudrey.com':    { origin: 'https://deck2vid-fenbmfwl.manus.space', prefix: '', block: ['/api/'] },
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
const OG_MANUS = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663032705003/yfLoUttebxQoIRae.jpg';
const MEDIA_BASE = 'https://raw.githubusercontent.com/midnghtsapphire/oaudrey-pages/31606300061e8ae1c6ff78a77ee1614575bbccab/media/deck-to-video';
const MEDIA_TYPES = { mp4: 'video/mp4', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp' };
// Allowlisted paths relative to MEDIA_BASE. Anything else under /manus-storage or /assets is not served from our copy.
const MEDIA = new Set([
  'taplio_deck_video_30s_b6beb9aa.mp4',
  'preview_1.8_48ccaf33.jpg',
  'preview_13.6_c83f7a18.jpg',
  'preview_21.6_b9c09d2a.jpg',
  'preview_28.0_e514fbbe.jpg',
  'yfLoUttebxQoIRae.jpg',
  'assets/emblem.svg',
  'assets/icons/favicon-32.png',
  'assets/icons/apple-touch-icon.png',
]);

// Checkout for deck-to-video.oaudrey.com. Keys must match a[data-checkout] / checkout.json
// (the page does fetch('checkout.json') and sets a.href = cfg[a.dataset.checkout]).
const DFY_MAILTO = 'mailto:angelreporters@gmail.com?subject=Done-for-you%20deck%20video%20(from%20%24299)&body=Hi%20Audrey%2C%0A%0AI%27d%20like%20a%20done-for-you%2030-second%20video%20from%20my%20deck.%20Deck%20link%3A%20%0ADeadline%3A%20%0A%0AThanks%2C';
const CHECKOUT = {
  playbook: 'https://angelreporter.gumroad.com/l/deck-to-video-playbook',
  kit: 'https://angelreporter.gumroad.com/l/deck-to-video-kit',
  dfy: DFY_MAILTO,
};
function checkoutJson() {
  return new Response(JSON.stringify(CHECKOUT), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
}
function rewriteProductOfferUrls(html) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (full, body) => {
    try {
      const data = JSON.parse(body);
      if (data['@type'] === 'Product' && Array.isArray(data.offers)) {
        for (const o of data.offers) {
          if (o.name === 'Deck-to-Video Playbook (PDF)') o.url = CHECKOUT.playbook;
          else if (o.name === 'Deck-to-Video Full Kit') o.url = CHECKOUT.kit;
        }
        return '<script type="application/ld+json">' + JSON.stringify(data) + '</script>';
      }
    } catch (e) { /* leave original */ }
    return full;
  });
}
function checkoutHtmlRewriter() {
  return new HTMLRewriter()
    .on('a[data-checkout="playbook"]', { element(el) { el.setAttribute('href', CHECKOUT.playbook); } })
    .on('a[data-checkout="kit"]', { element(el) { el.setAttribute('href', CHECKOUT.kit); } });
}

const text = (s, status = 404) => new Response(s, { status, headers: { 'content-type': 'text/plain' } });

// OpenAudrey redaction (Audrey, 2026-11-28: "Yes All" / hide tax ID and server details).
// Do not hard-code the EIN. Also hide published hosting internals on this subdomain only.
function isBlockedOpenAudreyPath(pathname) {
  const p = pathname.toLowerCase();
  return /^\/openaudrey\/(core|deploy)(\/|$)/.test(p)
    || p === '/openaudrey/package.json'
    || p === '/openaudrey/package-lock.json'
    || p === '/openaudrey/audit-codebase.sh'
    || p === '/openaudrey/baseline_audit.txt'
    || p === '/openaudrey/docs/audit-codebase.sh';
}
function redactOpenAudrey(body) {
  if (typeof body !== 'string') return body;
  body = body.replace(/(Federal\s+EIN:?\s*)\d{2}-\d{7}/gi, '$1[redacted]');
  body = body.replace(/(\bEIN:?\s*)\d{2}-\d{7}/g, '$1[redacted]');
  body = body.replace(/\b\d{2}-\d{7}\b/g, '[redacted]');
  body = body.replace(/vault\.freedomangelcorps\.com/gi, '[redacted]');
  body = body.replace(/127\.0\.0\.1:3001/g, '[redacted]');
  body = body.replace(/(?<![\d.])(?!127\.)(?!0\.)(?!255\.)(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g, '[redacted]');
  body = body.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, (block) => {
    const plain = block.replace(/<[^>]+>/g, '');
    if (/DROPLET|do-deploy|droplet-config|Vault droplet|Caddy\s*(?:\(TLS\))?\s*→\s*Vault|pm2 start/i.test(plain)) {
      return '<pre>[Infrastructure details redacted]</pre>';
    }
    return block;
  });
  body = body.replace(/```[\s\S]*?```/g, (block) => {
    if (/DROPLET|do-deploy|droplet-config|Vault droplet|Caddy\s*(?:\(TLS\))?\s*→\s*Vault|pm2 start|127\.0\.0\.1:3001/i.test(block)) {
      return '```\n[Infrastructure details redacted]\n```';
    }
    return block;
  });
  body = body.replace(/<h2[^>]*id="control-server-api"[^>]*>[\s\S]*?(?=<h2\b)/i, '<h2 id="control-server-api">Control Server API</h2><p>[Internal control API details redacted]</p>\n');
  body = body.replace(/deploy to the (?:core|MindMappr) droplet/gi, 'deploy automatically');
  body = body.replace(/sync to the core droplet/gi, 'sync automatically');
  body = body.replace(/Caddy \(TLS\) → Vault \(8200\)/g, '[redacted]');
  body = body.replace(/Caddy → Vault :8200/g, '[redacted]');
  body = body.replace(/Daily encrypted backups → DO\s*Spaces/gi, '[redacted]');
  body = body.replace(/node deploy\/do-deploy\.js[^\n<]*/g, '[redacted]');
  body = body.replace(/deploy\/do-deploy\.js/g, '[redacted]');
  body = body.replace(/deploy\/droplet-config\.json/g, '[redacted]');
  body = body.replace(/pm2 start[^\n<]*/g, '[redacted]');
  body = body.replace(/pm2 save/g, '[redacted]');
  body = body.replace(/pm2 startup/g, '[redacted]');
  return body;
}
function isRedactableType(ct) {
  return /text\/html|text\/plain|text\/markdown|text\/x-markdown|text\/xml|application\/json|application\/javascript|application\/xml|text\/javascript/.test(ct);
}


function robotsFor(host) {
  return 'User-agent: *\nAllow: /\nSitemap: https://' + host + '/sitemap.xml\n';
}
function sitemapFor(host, app) {
  const loc = app.home ? 'https://' + host + app.home : 'https://' + host + '/';
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>' + loc + '</loc></url>\n</urlset>\n';
}
function mediaKey(pathname) {
  if (pathname.startsWith('/manus-storage/')) return pathname.slice('/manus-storage/'.length);
  if (pathname.startsWith('/assets/')) return pathname.slice(1);
  return null;
}
async function serveOurMedia(req, u) {
  const key = mediaKey(u.pathname);
  if (!key || key.includes('..') || key.includes('//') || !MEDIA.has(key)) return null;
  const h = new Headers();
  for (const k of ['range', 'if-none-match', 'if-modified-since', 'accept', 'accept-encoding']) { const v = req.headers.get(k); if (v) h.set(k, v); }
  h.set('user-agent', 'oaudrey-app-paths');
  const r = await fetch(MEDIA_BASE + '/' + key, { method: req.method, headers: h, redirect: 'follow' });
  const ext = (key.split('.').pop() || '').toLowerCase();
  const out = new Headers();
  out.set('content-type', MEDIA_TYPES[ext] || r.headers.get('content-type') || 'application/octet-stream');
  for (const k of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) { const v = r.headers.get(k); if (v) out.set(k, v); }
  out.set('cache-control', 'public, max-age=86400');
  out.set('x-content-type-options', 'nosniff');
  out.set('x-media-source', 'oaudrey-pages-media');
  return new Response(req.method === 'HEAD' ? null : r.body, { status: r.status, headers: out });
}

export default {
  async fetch(req) {
    const u = new URL(req.url);
    const app = APPS[u.hostname];
    if (!app) return text('Not found');
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
    if (u.pathname === '/robots.txt') return new Response(robotsFor(u.hostname), { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' } });
    if (u.pathname === '/sitemap.xml') return new Response(sitemapFor(u.hostname, app), { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=300' } });
    if (u.hostname === 'deck-to-video.oaudrey.com') {
      if (u.pathname === '/checkout.json') return checkoutJson();
      const local = await serveOurMedia(req, u);
      if (local) return local;
    }
    if ((app.block || []).some(p => u.pathname.startsWith(p))) return text('Not found');
    if (u.hostname === 'openaudrey.oaudrey.com' && isBlockedOpenAudreyPath(u.pathname)) return text('Not found');
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
      // Do not send the browser to Manus/CloudFront for media we now host.
      if (u.hostname === 'deck-to-video.oaudrey.com' && /manus-storage|manuscdn|cloudfront\.net/.test(to) === false) { /* keep */ }
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
      html = html.split(app.origin + p + '/').join(publicBase + (app.keepPrefix ? p + '/' : '/'));
      html = html.split(app.origin + p).join(publicBase + (app.keepPrefix ? p : ''));
      if (!p) html = html.split(app.origin).join(publicBase);
      if (u.hostname === 'deck-to-video.oaudrey.com') {
        html = html.split(OG_MANUS).join(publicBase + '/manus-storage/yfLoUttebxQoIRae.jpg');
        html = rewriteProductOfferUrls(html);
        out.delete('content-length'); out.delete('etag'); out.delete('content-range');
        out.set('cache-control', 'public, max-age=300');
        return checkoutHtmlRewriter().transform(new Response(html, { status: 200, headers: out }));
      }
      if (u.hostname === 'openaudrey.oaudrey.com') html = redactOpenAudrey(html);
      out.delete('content-length'); out.delete('etag'); out.delete('content-range');
      out.set('cache-control', 'public, max-age=300');
      return new Response(html, { status: 200, headers: out });
    }
    if (u.hostname === 'openaudrey.oaudrey.com' && req.method === 'GET' && r.status === 200 && isRedactableType(ct)) {
      let body = redactOpenAudrey(await r.text());
      out.delete('content-length'); out.delete('etag'); out.delete('content-range');
      out.set('cache-control', 'public, max-age=300');
      return new Response(body, { status: 200, headers: out });
    }
    return new Response(req.method === 'HEAD' ? null : r.body, { status: r.status, headers: out });
  },
};
