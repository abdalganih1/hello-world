#!/usr/bin/env python3
"""دجانة: بيسحب المنتجات من متجر دجانة (KV تبع Worker dojana-store) وبيبني ملف الموقع.

الاستعمال:
  CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... python3 sync.py      # سحب من كلاودفلير
  python3 sync.py products.json settings.json                              # من ملفات محلية

الناتج: img/*.webp (صور مضغوطة) و dajana.js (إعدادات الموقع لقالب البلكسي).
"""
import base64, io, json, os, sys, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
NS = "bb748acef03b481dad98d60663a81204"  # KV: PRODUCTS تبع dojana-store
STORE = "https://dojana.technoenjaz.com"
CAT = {"plexi": "plexi", "بلكسي": "plexi", "mdf": "mdf", "MDF": "mdf", "uv": "uv", "طباعة UV": "uv", "vinyl": "vinyl"}
FEATURED = ["ستاند خطبه/ زواج", "الفراشة الملكية", "أجنحة الملاك", "مصباح ثلاثي الأبعاد", "ستاند مرآة مزين جاهز", "دفتر فراشة", "تاج ذهبي", "درع تخرج بلكسي", "قلب مرآتي", "مراية عروس لؤلؤ", "لوح عقد قران وخطوبة", "صينية تخرج"]


def kv(key):
    acc, tok = os.environ["CLOUDFLARE_ACCOUNT_ID"], os.environ["CLOUDFLARE_API_TOKEN"]
    url = f"https://api.cloudflare.com/client/v4/accounts/{acc}/storage/kv/namespaces/{NS}/values/{key}"
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + tok})
    return json.loads(urllib.request.urlopen(req, timeout=120).read())


def save_img(data_url, name):
    raw = base64.b64decode(data_url.split(",", 1)[1])
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    im.thumbnail((1000, 1000))
    im.save(os.path.join(HERE, "img", name), "WEBP", quality=80)
    return "img/" + name


def main():
    if len(sys.argv) > 2:
        products, settings = (json.load(open(p)) for p in sys.argv[1:3])
    else:
        products, settings = kv("products"), kv("settings")
    os.makedirs(os.path.join(HERE, "img"), exist_ok=True)
    clean = lambda s: (s or "").replace("​", "").strip()
    items, seen = [], set()
    for p in products:
        imgs = [save_img(d, f"{p['id']}{'' if i == 0 else '-' + str(i)}.webp") for i, d in enumerate(p.get("images") or []) if d.startswith("data:")]
        name = clean(p["name"])
        feat = any(f in name for f in FEATURED) and name not in seen
        seen.add(name)
        it = {"name": name, "cat": CAT.get(p.get("category"), "plexi"), "price": p.get("price") or 0, "desc": clean(p.get("description")), "details": clean(p.get("details")), "imgs": imgs, "url": f"{STORE}/product/{p['id']}"}
        if feat: it["featured"] = True
        items.append(it)
    # المميز أول شي
    items.sort(key=lambda x: not x.get("featured"))
    if settings.get("logo", "").startswith("data:"):
        raw = base64.b64decode(settings["logo"].split(",", 1)[1])
        open(os.path.join(HERE, "img", "logo.png"), "wb").write(raw)
    out = "/* مولّد من sync.py: لا تعدّله بإيدك */\nwindow.DAJANA_ITEMS = " + json.dumps(items, ensure_ascii=False, indent=0) + ";\n"
    open(os.path.join(HERE, "products.js"), "w").write(out)
    print(len(items), "منتج،", sum(1 for i in items if i.get("featured")), "مميز")


if __name__ == "__main__":
    main()
