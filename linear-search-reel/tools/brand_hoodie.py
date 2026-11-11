"""Puts the تكنو انجاز mark on خوارزمو's hoodie: paints out the printed cap emblem on the chest (cv2.inpaint) and prints the
brand mark in its place, with the same soft cyan glow the old print had. Reads assets/k/orig/*.png, writes assets/k/*.png.
The mark is rebuilt from techno-injaz-intro/assets/logo (three facets + the gradient dot).  Usage: python3 tools/brand_hoodie.py"""
import json, os, cv2, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); LOGO = os.path.join(ROOT, "../techno-injaz-intro/assets/logo")
EMB = {"angry": (141, 363, 75, 51), "idea": (164, 348, 59, 50), "presenting": (209, 336, 63, 51), "celebrating": (217, 311, 63, 49),
       "hero": (292, 656, 124, 99), "wink": (169, 381, 79, 56), "surprised": (155, 369, 81, 59),
       "walking": (162, 322, 51, 49), "front": (142, 441, 86, 64)}
# ---- the mark
d = json.load(open(os.path.join(LOGO, "logo.json"))); Wc, Hc = d["canvas"]; mark = np.zeros((Hc, Wc, 4), np.float32)
for k in d["pieces"]:
    p = cv2.imread(os.path.join(LOGO, k + ".png"), cv2.IMREAD_UNCHANGED).astype(np.float32); a = p[:, :, 3:4] / 255
    mark[:, :, :3] = mark[:, :, :3] * (1 - a) + p[:, :, :3] * a; mark[:, :, 3:4] = np.maximum(mark[:, :, 3:4], a * 255)
dd = d["dot"]; cx, cy, r = dd["cx"], dd["cy"], dd["r"]; yy, xx = np.mgrid[0:Hc, 0:Wc]
u = np.clip((xx - (cx - r)) / (2 * r), 0, 1)[..., None]; col = np.array([0xac, 0x62, 0x47], np.float32) * (1 - u) + np.array([0xac, 0xb7, 0x12], np.float32) * u
a = np.clip(r - np.hypot(xx - cx, yy - cy) + 0.5, 0, 1)[..., None]; mark[:, :, :3] = mark[:, :, :3] * (1 - a) + col * a; mark[:, :, 3:4] = np.maximum(mark[:, :, 3:4], a * 255)
ys, xs = np.where(mark[:, :, 3] > 8); mark = mark[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
# brighten a touch so it reads on the dark fabric like a glowing print
mark[:, :, :3] = np.clip(mark[:, :, :3] * 1.18 + 12, 0, 255)

for pose, (x, y, w, h) in EMB.items():
    im = cv2.imread(os.path.join(ROOT, f"assets/k/orig/{pose}.png"), cv2.IMREAD_UNCHANGED); H, W = im.shape[:2]
    hsv = cv2.cvtColor(im[:, :, :3], cv2.COLOR_BGR2HSV); pad = max(6, int(0.18 * h))
    x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(W, x + w + pad), min(H, y + h + pad)
    roi = np.zeros((H, W), np.uint8); roi[y0:y1, x0:x1] = 1
    glowy = ((hsv[:, :, 2] > 70) & (roi > 0) & (im[:, :, 3] > 200)).astype(np.uint8)          # the print and its halo (fabric is darker)
    hole = cv2.dilate(glowy, np.ones((5, 5)), iterations=2) * roi
    out = im.copy(); out[:, :, :3] = cv2.inpaint(im[:, :, :3], hole * 255, 7, cv2.INPAINT_TELEA)
    # fabric texture back: a little noise so the patch is not flat
    rng = np.random.default_rng(1); n = rng.normal(0, 3, (H, W, 1)); out[:, :, :3] = np.clip(out[:, :, :3].astype(np.float32) + n * hole[..., None], 0, 255).astype(np.uint8)
    # print the mark, centred on the old emblem, a bit taller than it
    mh = int(h * 1.12); mw = int(mh * mark.shape[1] / mark.shape[0]); m = cv2.resize(mark, (mw, mh), interpolation=cv2.INTER_AREA)
    ox, oy = int(x + w / 2 - mw / 2), int(y + h / 2 - mh / 2); g = 14
    canvas = np.zeros((H + 2 * g, W + 2 * g, 4), np.float32); canvas[oy + g:oy + g + mh, ox + g:ox + g + mw] = m; canvas = canvas[g:-g, g:-g]
    al = canvas[:, :, 3:4] / 255; glow = cv2.GaussianBlur(al[:, :, 0], (0, 0), max(2.0, h * 0.09))[..., None] * 0.55
    base = out[:, :, :3].astype(np.float32); base = base + glow * (np.array([200, 230, 60], np.float32) - base) * 0.6   # cyan halo (BGR)
    base = base * (1 - al) + canvas[:, :, :3] * al
    out[:, :, :3] = np.clip(base, 0, 255).astype(np.uint8); out[:, :, 3] = np.where(im[:, :, 3] > 0, im[:, :, 3], out[:, :, 3])
    cv2.imwrite(os.path.join(ROOT, f"assets/k/{pose}.png"), out); print("branded", pose)
