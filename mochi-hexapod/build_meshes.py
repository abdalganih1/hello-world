"""Decimates the original Mochi STLs (assets/stl, from github.com/rookidroid/hexapod, GPL-3.0) into compact
binary meshes for the browser (assets/mesh/*.bin: [nv, nf] uint32, positions float32, indices uint32).
Shapes stay within ~0.1 mm of the originals; only the triangle count drops so SwiftShader renders faster."""
import glob, os
import numpy as np, trimesh, fast_simplification as fs

os.makedirs("assets/mesh", exist_ok=True)
for f in sorted(glob.glob("assets/stl/*.stl")):
    n = os.path.basename(f)[:-4]
    m = trimesh.load(f); m.merge_vertices()
    v, fc = fs.simplify(m.vertices.astype(np.float32), m.faces.astype(np.int32),
                        target_reduction={"body_base": 0.75, "body_head": 0.6, "body_top": 0.6}.get(n, 0.45))
    with open(f"assets/mesh/{n}.bin", "wb") as o:
        o.write(np.array([len(v), len(fc)], np.uint32).tobytes())
        o.write(v.astype(np.float32).tobytes()); o.write(fc.astype(np.uint32).tobytes())
    print(n, len(m.faces), "->", len(fc))
