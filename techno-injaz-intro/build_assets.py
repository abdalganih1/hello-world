"""Cuts the flat logo image into transparent layers (A body pieces + dot) at 4x resolution.

Usage: python3 build_assets.py assets/source-logo.jpg assets/logo
Writes <out>/{top,left,right}.png (RGBA, same canvas) and <out>/logo.json (geometry + sampled colors).
"""
import json, os, sys
import cv2
import numpy as np

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
S = 4

img = cv2.imread(src)
big = cv2.resize(img, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
h, w = big.shape[:2]

# White disc behind the logo: fit a circle to the largest near-white blob.
white = (big.min(axis=2) > 235).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(white)
disc = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
cnts, _ = cv2.findContours(disc, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
(dcx, dcy), dr = cv2.minEnclosingCircle(max(cnts, key=cv2.contourArea))
inside = np.zeros((h, w), np.uint8)
cv2.circle(inside, (int(dcx), int(dcy)), int(dr * 0.93), 1, -1)

dist = 255 - big.min(axis=2)  # distance from white
mask = ((dist > 60) & (inside > 0)).astype(np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))

n, lab, st, cen = cv2.connectedComponentsWithStats(mask, connectivity=8)
comps = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 4000]
print("components:", [(i, int(st[i, cv2.CC_STAT_AREA]), [int(v) for v in cen[i]]) for i in comps])

# Colors right up to the edges: inpaint the anti-aliased white fringe from the interior.
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
interior = cv2.erode(mask, k)
band = ((cv2.dilate(mask, k) > 0) & (interior == 0)).astype(np.uint8) * 255
clean = cv2.inpaint(big, band, 5, cv2.INPAINT_TELEA)

# Name the pieces by geometry.
areas = {i: st[i, cv2.CC_STAT_AREA] for i in comps}
def circ(i):
    x, y, bw, bh, a = st[i]
    return abs(bw - bh) / max(bw, bh) + abs(a - np.pi * (bw / 2) * (bh / 2)) / a
dot_id = min(comps, key=circ)
rest = [i for i in comps if i != dot_id]
top_id = min(rest, key=lambda i: st[i, cv2.CC_STAT_TOP])
side = sorted([i for i in rest if i != top_id], key=lambda i: cen[i][0])
names = {top_id: "top", side[0]: "left", side[1]: "right"}
print("dot:", dot_id, "names:", names)

ys, xs = np.where(np.isin(lab, comps))
pad = 24
x0, x1, y0, y1 = xs.min() - pad, xs.max() + pad, ys.min() - pad, ys.max() + pad
W, H = int(x1 - x0), int(y1 - y0)

def alpha_of(m):
    m = cv2.erode(m, np.ones((3, 3), np.uint8))
    return np.clip(cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.6) * 1.15, 0, 1)

meta = {"canvas": [W, H], "scale": S, "pieces": {}}
for cid, name in names.items():
    m = (lab == cid).astype(np.uint8)
    a = alpha_of(m)
    rgba = np.dstack([clean, (a * 255).astype(np.uint8)])[y0:y1, x0:x1]
    cv2.imwrite(os.path.join(out, name + ".png"), rgba, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    yy, xx = np.where(m > 0)
    low = yy > yy.max() - 0.03 * (yy.max() - yy.min())
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    poly = cv2.approxPolyDP(c, 0.006 * cv2.arcLength(c, True), True)[:, 0, :]
    meta["pieces"][name] = {
        "poly": [[int(px - x0), int(py - y0)] for px, py in poly],
        "bbox": [int(xx.min() - x0), int(yy.min() - y0), int(xx.max() - xx.min()), int(yy.max() - yy.min())],
        "centroid": [float(xx.mean() - x0), float(yy.mean() - y0)],
        "tip": [float(xx[low].mean() - x0), float(yy.max() - y0)],
    }

# The dot is redrawn as a vector, so only geometry + colors are needed.
m = (lab == dot_id).astype(np.uint8)
yy, xx = np.where(m > 0)
cx, cy, r = xx.mean(), yy.mean(), float(np.sqrt(m.sum() / np.pi))
def avg(mask2):
    sel = (m > 0) & mask2
    return [int(v) for v in clean[sel][:, ::-1].mean(axis=0)]
X, Y = np.meshgrid(np.arange(w), np.arange(h))
d = np.hypot(X - cx, Y - cy) / r
meta["dot"] = {
    "cx": float(cx - x0), "cy": float(cy - y0), "r": r,
    "left": avg((X < cx - 0.35 * r)), "right": avg((X > cx + 0.35 * r)),
    "top": avg((Y < cy - 0.35 * r)), "bottom": avg((Y > cy + 0.35 * r)),
    "core": avg(d < 0.35), "rim": avg((d > 0.86) & (d < 1.0)),
}
# Main brand colors sampled from the big pieces.
def piece_avg(cid, top):
    mm = (lab == cid)
    yy, xx = np.where(mm)
    cut = np.percentile(yy, 20 if top else 80)
    sel = (yy < cut) if top else (yy > cut)
    return [int(v) for v in clean[yy[sel], xx[sel]][:, ::-1].mean(axis=0)]
meta["colors"] = {"topTeal": piece_avg(top_id, True), "sideBlue": piece_avg(side[0], False), "sideTeal": piece_avg(side[1], True)}
json.dump(meta, open(os.path.join(out, "logo.json"), "w"), indent=1)
print(json.dumps(meta, indent=1))

# Composite check on the dark background.
canvas = np.full((H, W, 3), (20, 16, 12), np.uint8)
for name in names.values():
    p = cv2.imread(os.path.join(out, name + ".png"), cv2.IMREAD_UNCHANGED).astype(np.float32)
    al = p[..., 3:] / 255
    canvas = (canvas * (1 - al) + p[..., :3] * al).astype(np.uint8)
cv2.circle(canvas, (int(cx - x0), int(cy - y0)), int(r), (200, 120, 60), -1)
cv2.imwrite(os.path.join(out, "_check.jpg"), cv2.resize(canvas, None, fx=0.5, fy=0.5))
