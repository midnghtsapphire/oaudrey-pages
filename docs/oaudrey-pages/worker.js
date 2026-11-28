// oaudrey-pages edge server (Git-Master, 2026-11-19; IndexRunner, 2026-11-28).
// Serves site/ from midnghtsapphire/oaudrey-pages@main for oaudrey.com and www.oaudrey.com.
// /openaudrey and /openaudrey/* are proxied from the Cloudflare Pages project
// openaudrey-site (https://openaudrey-site.pages.dev), with tax-ID and server-detail
// redaction at the edge. Peekabyss stays on the peekabyss-pages Worker (more-specific
// routes). GET/HEAD only; no cookies forwarded or set. Cloudflare Web Analytics is
// allowed (zone-level, cookie-free). Rollback: point SRC back at a earlier commit
// and/or remove the /openaudrey branch below; do not delete routes or DNS.
const SRC = 'https://raw.githubusercontent.com/midnghtsapphire/oaudrey-pages/main/site';
const OA_ORIGIN = 'https://openaudrey-site.pages.dev';
const TYPES = {
  html: 'text/html; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  pdf: 'application/pdf',
  txt: 'text/plain; charset=utf-8',
  md: 'text/plain; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  json: 'application/json',
  xml: 'application/xml; charset=utf-8',
};

function isBlockedOpenAudreyPath(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';
  return /^\/openaudrey\/(core|deploy)(\/|$)/.test(p)
    || p === '/openaudrey/package.json'
    || p === '/openaudrey/package-lock.json'
    || p === '/openaudrey/audit-codebase.sh'
    || p === '/openaudrey/baseline_audit.txt'
    || p === '/openaudrey/docs/audit-codebase.sh';
}
function redactOpenAudrey(body) {
  body = body.replace(/(Federal\s+EIN:?\s*)\d{2}-\d{7}/gi, '$1[redacted]');
  body = body.replace(/(\bEIN:?\s*)\d{2}-\d{7}/g, '$1[redacted]');
  body = body.replace(/\b\d{2}-\d{7}\b/g, '[redacted]');
  body = body.replace(/vault\.freedomangelcorps\.com/gi, '[redacted]');
  body = body.replace(/127\.0\.0\.1:3001/g, '[redacted]');
  body = body.replace(/(?<![\d.])(?!127\.)(?!0\.)(?!255\.)(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g, '[redacted]');
  body = body.replace(/<pre[^>]*>[\s\S]*?(droplet|do-deploy|pm2 start|Caddy \(TLS\))[\s\S]*?<\/pre>/gi, () => {
    return '<pre>[Infrastructure details redacted]</pre>';
  });
  body = body.replace(/```[\s\S]*?(droplet|do-deploy|pm2 start)[\s\S]*?```/gi, () => {
    return '```\n[Infrastructure details redacted]\n```';
  });
  body = body.replace(/<h2[^>]*id="control-server-api"[^>]*>[\s\S]*?(?=<h2\b)/i, '<h2 id="control-server-api">Control Server API</h2><p>[Internal control API details redacted]</p>\n');
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

async function serveOpenAudrey(req, u) {
  if (u.pathname === '/openaudrey') {
    u.pathname = '/openaudrey/';
    return Response.redirect(u.toString(), 301);
  }
  if (isBlockedOpenAudreyPath(u.pathname)) {
    return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } });
  }
  const target = OA_ORIGIN + u.pathname + u.search;
  const h = new Headers();
  for (const k of ['range', 'accept', 'accept-encoding', 'if-none-match', 'if-modified-since', 'accept-language']) {
    const v = req.headers.get(k); if (v) h.set(k, v);
  }
  h.set('user-agent', 'Mozilla/5.0 (compatible; oaudrey-pages)');
  const r = await fetch(target, { method: req.method, headers: h, redirect: 'manual' });
  if (r.status >= 300 && r.status < 400) {
    let to = r.headers.get('location') || '/openaudrey/';
    if (to.startsWith(OA_ORIGIN)) to = to.slice(OA_ORIGIN.length) || '/';
    if (to.startsWith('/')) {
      const dest = new URL(u.toString());
      dest.pathname = to.split('?')[0];
      return Response.redirect(dest.toString(), r.status);
    }
    return Response.redirect(to, r.status);
  }
  const out = new Headers();
  for (const k of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified', 'cache-control']) {
    const v = r.headers.get(k); if (v) out.set(k, v);
  }
  out.set('x-content-type-options', 'nosniff');
  out.set('referrer-policy', 'strict-origin-when-cross-origin');
  const ct = (r.headers.get('content-type') || '').toLowerCase();
  if (req.method === 'GET' && r.status === 200 && isRedactableType(ct)) {
    let body = redactOpenAudrey(await r.text());
    out.delete('content-length'); out.delete('etag'); out.delete('content-range');
    out.set('cache-control', 'public, max-age=300');
    return new Response(body, { status: 200, headers: out });
  }
  return new Response(req.method === 'HEAD' ? null : r.body, { status: r.status, headers: out });
}

export default {
  async fetch(req) {
    const u = new URL(req.url);
    if (u.hostname === 'www.oaudrey.com') {
      u.hostname = 'oaudrey.com';
      return Response.redirect(u.toString(), 301);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
    }
    if (u.pathname === '/openaudrey' || u.pathname.startsWith('/openaudrey/')) {
      return serveOpenAudrey(req, u);
    }
    let p = u.pathname;
    if (p.endsWith('/')) p += 'index.html';
    if (p === '/lander') return Response.redirect('https://oaudrey.com/', 301);
    const ext = (p.split('.').pop() || '').toLowerCase();
    let r = await fetch(SRC + p, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (r.status === 404 && !p.includes('.')) {
      r = await fetch(SRC + p + '/index.html', { cf: { cacheTtl: 300 } });
    }
    if (!r.ok) {
      return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } });
    }
    const h = new Headers();
    h.set('content-type', TYPES[ext] || TYPES.html);
    h.set('cache-control', 'public, max-age=300');
    h.set('x-content-type-options', 'nosniff');
    return new Response(r.body, { status: 200, headers: h });
  },
};
