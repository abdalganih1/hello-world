#!/usr/bin/env bash
# بيجمع موقع دجانة بمجلد dist جاهز للنشر على كلاودفلير:
#   bash build.sh && npx wrangler deploy   (Worker: dajana-showcase، بيمرّر /admin و /api و /img لـ dojana-store)
set -euo pipefail
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist
cp -r ../../engine ../../templates img products.js dajana.js manifest.webmanifest sw.js dist/
sed -e 's|\.\./\.\./||g' index.html > dist/index.html
echo "dist جاهز: $(du -sh dist | cut -f1)"
