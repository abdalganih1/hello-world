"""Tile review stills into contact sheets: python3 tools/sheet.py DIR [per_sheet=9] [cols=3] [width=640]"""
import sys, os, cv2, numpy as np
d = sys.argv[1]; per = int(sys.argv[2]) if len(sys.argv) > 2 else 9; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3; w = int(sys.argv[4]) if len(sys.argv) > 4 else 640
fs = sorted(f for f in os.listdir(d) if f.endswith(".jpg") and not f.startswith("sheet"))
for s in range(0, len(fs), per):
    tiles = []
    for f in fs[s:s + per]:
        im = cv2.imread(os.path.join(d, f)); im = cv2.resize(im, (w, w * 9 // 16), interpolation=cv2.INTER_AREA)
        cv2.rectangle(im, (0, 0), (200, 24), (0, 0, 0), -1); cv2.putText(im, f[:-4], (4, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1); tiles.append(im)
    while len(tiles) % cols: tiles.append(np.zeros_like(tiles[0]))
    rows = [np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]
    cv2.imwrite(os.path.join(d, f"sheet{s // per:02d}.jpg"), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
print("sheets:", (len(fs) + per - 1) // per)
