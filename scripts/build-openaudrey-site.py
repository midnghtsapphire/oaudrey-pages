#!/usr/bin/env python3
"""IndexRunner: build a static copy of the OpenAudrey docs for Cloudflare Pages.

Replaces the GitHub Pages (Jekyll) copy of midnghtsapphire/openaudrey, which is unpublished.
Usage: build-openaudrey-site.py <openaudrey-checkout> [out-dir]   (needs pandoc)
Output: <out>/openaudrey/... (the oaudrey-app-paths Worker keeps the /openaudrey prefix),
<out>/404.html. Follows the repo's _config.yml exclude list. Big brand PNGs under assets/
are not copied (nothing in the pages embeds them). Static HTML only: no scripts, no analytics.
Fails if any output contains an EIN-shaped string, an IP address, 127.0.0.1:3001 or the vault host.
"""
import html, os, re, shutil, subprocess, sys

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else "openaudrey-site"
EXCLUDE_DIRS = {"deploy", "core", "tests", "mindmappr", "guardia", "research", "templates",
                "node_modules", "vendor", ".git", ".github", "assets"}
EXCLUDE_FILES = {"package.json", "package-lock.json", "audit-codebase.sh", "baseline_audit.txt",
                 "docs/VAULT_ACCESS_GUIDE.md", "docs/audit-codebase.sh",
                 "docs/MANUS_HANDOFF.md"}  # internal infra handoff (droplets, deploy steps): not published
CSS = """body{margin:0;background:#fff;color:#1f2328;font:16px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:24px 20px 60px}header a{font-weight:600;text-decoration:none;color:#0969da}
h1,h2,h3{line-height:1.25}h2{border-bottom:1px solid #d8dee4;padding-bottom:.3em}a{color:#0969da}
pre,code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:90%;background:#f6f8fa;border-radius:6px}
code{padding:.15em .35em}pre{padding:14px;overflow:auto}pre code{padding:0;background:none}
table{border-collapse:collapse;display:block;overflow:auto}td,th{border:1px solid #d0d7de;padding:6px 12px}
blockquote{margin:0;padding:0 1em;color:#59636e;border-left:.25em solid #d1d9e0}"""
PAGE = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><link rel="stylesheet" href="/openaudrey/style.css"></head>
<body><div class="wrap"><header><a href="/openaudrey/">openaudrey</a></header>
{body}</div></body></html>
"""

def page(md_path, rel_out):
    body = subprocess.run(["pandoc", "-f", "gfm", "-t", "html5", md_path], check=True,
                          capture_output=True, text=True).stdout
    body = re.sub(r'href="([^":#?]+)\.md(#[^"]*)?"',
                  lambda m: 'href="%s.html%s"' % (re.sub(r'(^|/)README$', r'\1index', m.group(1)), m.group(2) or ""), body)
    m = re.search(r"<h1[^>]*>(.*?)</h1>", body, re.S)
    title = html.escape(re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else os.path.basename(rel_out)) + " | openaudrey"
    dest = os.path.join(out, "openaudrey", rel_out)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w").write(PAGE.format(title=title, body=body))

shutil.rmtree(out, ignore_errors=True)
for d, dirs, files in os.walk(src):
    dirs[:] = [x for x in dirs if x not in EXCLUDE_DIRS]
    for f in files:
        rel = os.path.relpath(os.path.join(d, f), src).replace(os.sep, "/")
        if rel in EXCLUDE_FILES or not f.endswith(".md"):
            continue
        page(os.path.join(d, f), "index.html" if rel == "README.md" else rel[:-3] + ".html")
os.makedirs(os.path.join(out, "openaudrey"), exist_ok=True)
open(os.path.join(out, "openaudrey", "style.css"), "w").write(CSS)
open(os.path.join(out, "404.html"), "w").write(PAGE.format(title="Not found | openaudrey", body="<h1>Not found</h1>"))

bad = []
for d, _, files in os.walk(out):
    for f in files:
        t = open(os.path.join(d, f), errors="ignore").read()
        for name, rx in (("EIN-shaped", r"\b\d{2}-\d{7}\b"), ("IP address", r"(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])"),
                         ("127.0.0.1:3001", r"127\.0\.0\.1:3001"), ("vault host", r"vault\.freedomangelcorps\.com")):
            if re.search(rx, t):
                bad.append((os.path.join(d, f), name))
if bad:
    sys.exit("REFUSING: sensitive-looking strings in output: " + "; ".join("%s (%s)" % b for b in bad))
print("built", sum(len(fs) for _, _, fs in os.walk(out)), "files ->", out)
