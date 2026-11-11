"""Cleans خوارزمو's cut-outs (run after tools/brand_hoodie.py): the sheet poses were matted from a light grey background,
so some fog stayed (between head and hand, around the backpack) and the edges carry a pale halo.
  1. background fog: light, unsaturated pixels that are connected to the image border are made transparent
     (enclosed ones such as the eye whites are kept);
  2. tiny islands are dropped;
  3. edge decontamination: semi-transparent edge pixels take the colour of the nearest solid pixel (no white fringe),
     and the alpha edge is tightened by ~1 px.
Usage: python3 tools/clean_matte.py [pose ...]"""
import os, sys, cv2, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSES = sys.argv[1:] or ["angry", "idea", "presenting", "celebrating", "hero", "wink", "surprised", "thinking", "happy", "sad", "walking", "working", "studying", "front", "closeup"]
for pose in POSES:
    p = os.path.join(ROOT, f"assets/k/{pose}.png"); im = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    if im is None: continue
    H, W = im.shape[:2]; a = im[:, :, 3].astype(np.float32) / 255; hsv = cv2.cvtColor(im[:, :, :3], cv2.COLOR_BGR2HSV)
    S, V = hsv[:, :, 1].astype(int), hsv[:, :, 2].astype(int)
    bgl = ((S < 50) & (V > 150)) | (a < 0.35)
    if pose == "front":  # the sheet's dark title bar sits behind his antennas in this crop: drop dark pixels above the head
        top = np.zeros((H, W), bool); top[: int(0.138 * H)] = True
        tube = cv2.dilate(((V > 215) & (a > 0.5)).astype(np.uint8), np.ones((7, 7))) > 0          # keep the glowing tubes, drop the fog
        a[top & ~tube] = 0
        band = np.zeros((H, W), bool); band[int(0.138 * H):int(0.205 * H)] = True
        near = cv2.dilate(((V > 215) & (a > 0.5)).astype(np.uint8), np.ones((15, 15))) > 0
        a[band & (V > 85) & (V < 165) & ~near] = 0                                                         # the bar's leftover between the caps
        feet = np.zeros((H, W), bool); feet[int(0.965 * H):] = True; a[feet & (V < 215)] = 0              # the dark floor slab under his shoes                                   # looks like the light background, or is already clear
    pad = np.pad(bgl.astype(np.uint8), 1, constant_values=1); ff = pad.copy(); msk = np.zeros((H + 4, W + 4), np.uint8)
    cv2.floodFill(ff, msk, (0, 0), 2); outside = (ff[1:-1, 1:-1] == 2)
    a[outside] = 0
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8))
    if n > 2:
        big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); keep = np.zeros((H, W), bool)
        for i in range(1, n):
            if st[i, cv2.CC_STAT_AREA] > 0.015 * st[big, cv2.CC_STAT_AREA]: keep |= lab == i
        a *= cv2.dilate(keep.astype(np.uint8), np.ones((5, 5))) > 0
    solid = (a > 0.92).astype(np.uint8); band = ((a > 0.02) & (a <= 0.92)).astype(np.uint8)
    col = cv2.inpaint(im[:, :, :3], ((1 - solid) * 255).astype(np.uint8), 5, cv2.INPAINT_TELEA)  # colours pushed outward from the solid core
    out = im.copy(); out[:, :, :3] = np.where(band[..., None] > 0, col, im[:, :, :3])
    a = np.clip((a - 0.12) / 0.88, 0, 1); a = cv2.GaussianBlur(a, (0, 0), 0.6)
    out[:, :, 3] = (a * 255).astype(np.uint8); cv2.imwrite(p, out); print("clean", pose)
