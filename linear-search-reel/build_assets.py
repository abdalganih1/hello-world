"""Cuts خوارزمو's poses out of the character sheet + hero render into transparent PNGs (assets/k/*.png).
Matting: rembg (isnet/u2net). Small sheet poses are upscaled 2x (Lanczos + light unsharp) after matting.
Usage: pip install rembg onnxruntime opencv-python-headless && python3 build_assets.py [--crops-only]"""
import sys, os, json, cv2, numpy as np
D = os.path.dirname(os.path.abspath(__file__))
sheet = cv2.imread(os.path.join(D, "assets/src/khwarizmo-sheet.png"))
hero = cv2.imread(os.path.join(D, "assets/src/khwarizmo-hero.png"))
# x0, y0, x1, y1 on the 1536x1024 sheet
BOX = {
    "front": (40, 8, 245, 372), "closeup": (1122, 14, 1518, 404),
    "happy": (22, 412, 245, 640), "surprised": (255, 412, 478, 640), "wink": (488, 412, 712, 640), "thinking": (712, 412, 905, 640),
    "sad": (915, 412, 1110, 640), "angry": (1128, 412, 1322, 640),
    "presenting": (22, 668, 250, 990), "working": (280, 668, 485, 990), "studying": (505, 668, 735, 990),
    "walking": (775, 668, 985, 990), "celebrating": (985, 668, 1235, 990), "idea": (1270, 668, 1510, 990),
}
os.makedirs(os.path.join(D, "build/crops"), exist_ok=True)
for k, (x0, y0, x1, y1) in BOX.items():
    cv2.imwrite(os.path.join(D, f"build/crops/{k}.png"), sheet[y0:y1, x0:x1])
if "--crops-only" in sys.argv:
    sys.exit()

import onnxruntime as ort
MODEL = os.path.join(D, "build/isnet-general-use.onnx")  # github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx
sess = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])


def matte(bgr):
    h, w = bgr.shape[:2]
    x = cv2.resize(bgr, (1024, 1024), interpolation=cv2.INTER_LANCZOS4)[:, :, ::-1].astype(np.float32) / 255.0 - 0.5
    y = sess.run(None, {sess.get_inputs()[0].name: x.transpose(2, 0, 1)[None]})[0][0, 0]
    y = (y - y.min()) / (y.max() - y.min() + 1e-6)
    return cv2.resize(y, (w, h), interpolation=cv2.INTER_LINEAR)


def cut(bgr, scale, name, keep_largest=True, antenna=0):
    if scale != 1:
        bgr = cv2.resize(bgr, None, fx=scale, fy=scale, interpolation=cv2.INTER_LANCZOS4)
        blur = cv2.GaussianBlur(bgr, (0, 0), 1.6); bgr = cv2.addWeighted(bgr, 1.45, blur, -0.45, 0)
    a = matte(bgr)
    a = np.clip((a - 0.12) / 0.76, 0, 1)
    if keep_largest:  # drop stray islands (labels, sparkles)
        n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8))
        if n > 2:
            big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); keep = np.zeros_like(a)
            for i in range(1, n):
                if st[i, cv2.CC_STAT_AREA] > 0.02 * st[big, cv2.CC_STAT_AREA]: keep[lab == i] = 1
            a *= cv2.dilate(keep, np.ones((9, 9)))
    if antenna:  # the matting model drops the thin glowing antennas: add bright pixels above the head that touch the body
        v = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)[:, :, 2].astype(np.float32)
        ys0 = np.where(a.max(1) > 0.5)[0]; top = ys0.min(); limit = top + int(0.16 * (ys0.max() - top))
        bright = np.clip((v - antenna) / 60.0, 0, 1); bright[limit:] = 0
        both = ((a > 0.5) | (bright > 0.45)).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate(both, np.ones((5, 5), np.uint8)))
        body = np.bincount(lab[a > 0.5]).argmax()
        a = np.maximum(a, bright * (lab == body))
    a = cv2.GaussianBlur(a, (0, 0), 0.8)
    ys, xs = np.where(a > 0.05); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgba = np.dstack([bgr, (a * 255).astype(np.uint8)])[y0:y1, x0:x1]
    if name in TRIM:  # cut the floor reflection under the shoes
        cutrow = int(rgba.shape[0] * TRIM[name]); rgba = rgba[:cutrow].copy(); y1 = y0 + cutrow
        rgba[-6:, :, 3] = (rgba[-6:, :, 3] * np.linspace(1, 0, 6)[:, None]).astype(np.uint8)
    cv2.imwrite(os.path.join(D, f"assets/k/{name}.png"), rgba)
    return {"w": int(x1 - x0), "h": int(y1 - y0)}


TRIM = {"hero": 0.945, "presenting": 0.952, "idea": 0.953}
os.makedirs(os.path.join(D, "assets/k"), exist_ok=True)
meta = {}
for k, (x0, y0, x1, y1) in BOX.items():
    meta[k] = cut(sheet[y0:y1, x0:x1], 2, k, antenna=0 if k == "closeup" else 150)
meta["hero"] = cut(hero, 1, "hero")
json.dump(meta, open(os.path.join(D, "assets/k/meta.json"), "w"), indent=1)
print(meta)
