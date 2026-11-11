"""خوارزمو's rig: eye, mouth and antenna-tip positions per pose (measured by hand on assets/k/*.png, pixels of each pose image),
plus the cheek skin colour under each eye (for the eyelid when he blinks). Writes assets/k/rig.json.  Usage: python3 tools/rig.py"""
import json, os, cv2, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = {  # eyes: (x, y, r) · mouth: (x, y, w, h, open?) · tips: antenna balls · blink: False when an eye is already closed
    "angry":       {"eyes": [(113, 225, 32), (232, 222, 32)], "mouth": (180, 300, 38, 8, False), "tips": [(50, 18), (172, 14)], "blink": True},
    "presenting":  {"eyes": [(162, 188, 42), (265, 174, 30)], "mouth": (236, 234, 40, 20, True), "tips": [(71, 32), (221, 25)], "blink": True},
    "hero":        {"eyes": [(196, 370, 76), (424, 316, 66)], "mouth": (338, 418, 80, 40, True), "tips": [(89, 27), (291, 34)], "blink": False},
    "idea":        {"eyes": [(118, 203, 42), (226, 181, 30)], "mouth": (191, 246, 44, 8, False), "tips": [(40, 32), (162, 21)], "blink": True},
    "celebrating": {"eyes": [], "mouth": (237, 229, 50, 29, True), "tips": [(119, 29), (280, 29)], "blink": False},
    "wink":        {"eyes": [], "mouth": (203, 243, 46, 30, True), "tips": [(136, 12)], "blink": False},
    "surprised":   {"eyes": [(125, 195, 46), (244, 190, 38)], "mouth": (190, 240, 30, 40, True), "tips": [(47, 16), (170, 9)], "blink": True},
    "thinking":    {"eyes": [(122, 205, 45), (238, 203, 38)], "mouth": (185, 262, 50, 8, False), "tips": [(48, 16), (184, 16)], "blink": True},    "front":       {"eyes": [], "mouth": (175, 230, 30, 8, False), "tips": [], "blink": False},
    "walking":     {"eyes": [], "mouth": (200, 180, 30, 20, True), "tips": [], "blink": False},
}
out = {}
for pose, r in R.items():
    im = cv2.imread(os.path.join(ROOT, f"assets/k/{pose}.png"), cv2.IMREAD_UNCHANGED); skins = []
    hsv = cv2.cvtColor(im[:, :, :3], cv2.COLOR_BGR2HSV); H, W = im.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]
    for (x, y, rad) in r["eyes"]:  # skin around the eye: a ring 1.25r..1.7r, only mid-bright saturated blue pixels (no brows, no highlights)
        d = np.hypot(xx - x, yy - y); m = (d > rad * 1.25) & (d < rad * 1.7) & (hsv[:, :, 1] > 110) & (hsv[:, :, 2] > 120) & (hsv[:, :, 2] < 245) & (im[:, :, 3] > 200)
        top, bot = m & (yy < y), m & (yy >= y)
        c = lambda mm: "#%02x%02x%02x" % tuple(int(v) for v in np.median(im[mm][:, :3], 0)[::-1]) if mm.sum() > 10 else "#1d97d9"
        skins.append([c(top), c(bot)])
    out[pose] = {**r, "skin": skins}
json.dump(out, open(os.path.join(ROOT, "assets/k/rig.json"), "w"), indent=1); print({k: v["skin"] for k, v in out.items()})
