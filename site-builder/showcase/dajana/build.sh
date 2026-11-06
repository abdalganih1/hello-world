#!/usr/bin/env bash
# بيجمع موقع دجانة بمجلد dist جاهز للنشر على كلاودفلير:
#   bash build.sh && npx wrangler deploy   (Worker: dajana-showcase، بيمرّر /admin و /api و /img لـ dojana-store)
set -euo pipefail
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist
cp -r ../../engine ../../templates img products.js dajana.js manifest.webmanifest sw.js dist/
# <base href="/"> حتى المسارات النسبية تشتغل كمان من /product/<id>
sed -e 's|\.\./\.\./||g' -e 's|<head>|<head>\n<base href="/">|' index.html > dist/index.html
# رقم نسخة على ملفات الموقع حتى ما يضل حدا على نسخة قديمة من الكاش
V=$(date +%s)
sed -i -E "s#(src|href)=\"((engine|templates)/[^\"]+\.(js|css)|products\.js|dajana\.js)\"#\1=\"\2?v=$V\"#g" dist/index.html
echo "dist جاهز: $(du -sh dist | cut -f1)"
