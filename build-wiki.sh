#!/usr/bin/env bash
# IndexRunner: build the oaudrey.com wiki into ./wiki-site (strict: broken links fail the build).
# Usage: pip install -r requirements-wiki.txt && ./build-wiki.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdocs build --strict
# Same crawler stance as the rest of oaudrey.com (see docs/wiki/Home.md). Delete this line to allow indexing.
printf 'User-agent: *\nDisallow: /\n' > wiki-site/robots.txt
echo "built wiki-site/"
