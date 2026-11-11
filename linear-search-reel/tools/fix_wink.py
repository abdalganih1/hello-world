"""The wink pose lost its left antenna in the matting (thin glowing tube on a dark background). Rebuilds the pose cut-out:
isnet matte for the body + a brightness key for the antennas (the top of that sheet cell is only dark background and the
two glowing tubes), then writes assets/k/orig/wink.png and updates meta.json. Run brand_hoodie.py + clean_matte.py after.
Usage: python3 tools/fix_wink.py"""
import json, os, cv2, numpy as np, onnxruntime as ort
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sheet = cv2.imread(os.path.join(ROOT, "assets/src/khwarizmo-sheet.png")); x0, y0, x1, y1 = 488, 412, 712, 640
bgr = cv2.resize(sheet[y0:y1, x0:x1], None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4); bl = cv2.GaussianBlur(bgr, (0, 0), 1.6); bgr = cv2.addWeighted(bgr, 1.45, bl, -0.45, 0)
sess = ort.InferenceSession(os.path.join(ROOT, "build/isnet-general-use.onnx"), providers=["CPUExecutionProvider"])
h, w = bgr.shape[:2]; x = cv2.resize(bgr, (1024, 1024), interpolation=cv2.INTER_LANCZOS4)[:, :, ::-1].astype(np.float32) / 255 - 0.5
m = sess.run(None, {sess.get_inputs()[0].name: x.transpose(2, 0, 1)[None]})[0][0, 0]; m = (m - m.min()) / (m.max() - m.min() + 1e-6)
a = np.clip((cv2.resize(m, (w, h)) - 0.12) / 0.76, 0, 1)
V = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)[:, :, 2].astype(np.float32); bgV = np.median(V[:, :12])           # the dark backdrop at the left edge
key = np.clip((V - bgV - 35) / 95, 0, 1); top = np.zeros((h, w), bool); top[: int(0.30 * h)] = True
key[~top] = 0; key[:6] = 0
a = np.maximum(a, key); a = cv2.GaussianBlur(a, (0, 0), 0.7)
n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.4).astype(np.uint8)); big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
keep = np.zeros((h, w), bool)
for i in range(1, n):
    if i == big or (st[i, cv2.CC_STAT_TOP] < 0.3 * h and st[i, cv2.CC_STAT_AREA] > 200): keep |= lab == i     # body + both antennas
a *= cv2.dilate(keep.astype(np.uint8), np.ones((7, 7))) > 0
ys, xs = np.where(a > 0.05); X0, X1, Y0, Y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
out = np.dstack([bgr, (a * 255).astype(np.uint8)])[Y0:Y1, X0:X1]; cv2.imwrite(os.path.join(ROOT, "assets/k/orig/wink.png"), out)
mp = os.path.join(ROOT, "assets/k/meta.json"); meta = json.load(open(mp)); meta["wink"] = {"w": int(X1 - X0), "h": int(Y1 - Y0)}; json.dump(meta, open(mp, "w"), indent=1)
print("wink", meta["wink"], "offset", X0, Y0)
