"""Prepares BOXIT assets from the user's originals (no redrawing).

- logo.png: the original logo JPG with its white background keyed out (pixels of the mark are kept as-is,
  only the background/anti-aliased edge are un-mixed from white), upscaled with Lanczos.
- thumbs: real category / product photos cropped from the app screenshots, mapped to a brand duotone
  (dark green -> white) so the video stays inside the three allowed colours.
"""
import numpy as np
from PIL import Image

A = "assets/"
GREEN, ORANGE, WHITE = np.array([0x26, 0x63, 0x32]), np.array([0xF0, 0x5A, 0x28]), np.array([255, 255, 255])

# ---- logo ----
im = np.asarray(Image.open(A + "logo-original.jpg").convert("RGB")).astype(float)
chroma = im.max(2) - im.min(2)
a = np.clip((chroma - 45) / 70, 0, 1)
a = a * a * (3 - 2 * a)
rgb = np.where(a[..., None] > 0.02, (im - (1 - a[..., None]) * 255) / np.maximum(a[..., None], 1e-3), 0)
rgb = np.clip(rgb, 0, 255)
out = np.dstack([rgb, a * 255]).astype(np.uint8)
logo = Image.fromarray(out, "RGBA")
ys, xs = np.nonzero(a > 0.05)
logo = logo.crop((xs.min() - 4, ys.min() - 4, xs.max() + 5, ys.max() + 5))
logo = logo.resize((logo.width * 3, logo.height * 3), Image.LANCZOS)
logo.save(A + "logo.png")
print("logo", logo.size)

# ---- thumbnails (tritone) ----
def tritone(img):
    # editorial duotone: dark green shadows -> white highlights (orange stays reserved for UI accents)
    g = np.asarray(img.convert("L")).astype(float) / 255
    g = np.clip((g - np.percentile(g, 1)) / (np.percentile(g, 99) - np.percentile(g, 1) + 1e-6), 0, 1)
    c = GREEN + (WHITE - GREEN) * g[..., None]
    return Image.fromarray(c.astype(np.uint8))


cat = Image.open(A + "app-categories.jpg").convert("RGB")
prod = Image.open(A + "app-product.jpg").convert("RGB")
crops = {
    "t-restaurants": (cat, (507, 112, 633, 212)),
    "t-electronics": (cat, (86, 262, 206, 386)),
    "t-sweets": (cat, (480, 445, 660, 554)),
    "t-coffee": (cat, (83, 611, 209, 737)),
    "t-burger": (prod, (467, 478, 632, 643)),
}
for name, (src, box) in crops.items():
    c = src.crop(box)
    c = c.resize((c.width * 3, c.height * 3), Image.LANCZOS)
    c.save(A + name + "-orig.png")
    tritone(c).save(A + name + ".png")
    print(name, c.size)
