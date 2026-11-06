#!/usr/bin/env bash
# بيجمع موقع دجانة بمجلد dist جاهز للنشر على Cloudflare Pages:
#   bash build.sh && npx wrangler pages deploy dist --project-name dajana-showcase
set -euo pipefail
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist
cp -r ../../engine ../../templates img products.js dajana.js dist/
sed -e 's|\.\./\.\./||g' index.html > dist/index.html
echo "dist جاهز: $(du -sh dist | cut -f1)"
