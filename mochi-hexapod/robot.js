// Hexapod Mochi (rookidroid, GPL-3.0) rebuilt from its original STL parts.
// The STLs ship in their own part coordinates, so every part is placed here by matching its real holes:
// bearing holes on the body tabs (r = 81.8 mm, the firmware's leg mounts), servo windows, horn and pin holes.
// Kinematics follow software/path_tool/robots/mochi.json: coxa 36 mm, femur 43.6 mm, tibia 85.22 mm.
import * as THREE from "./lib/three.module.js";
import { toCreasedNormals } from "./lib/BufferGeometryUtils.js";

export const DIM = { mountR: 81.8, coxa: 36, femur: 43.65, tibia: 85.22, coxaZ: 17.3, clamp: 12.3 };
export const LEG_ANGLES = [60, 0, -60, 120, 180, 240]; // front_right, center_right, rear_right, front_left, center_left, rear_left

const PARTS = ["body_base", "body_top", "body_head", "body_side", "body_servo_side", "joint_cross", "joint_top", "joint_bottom",
  "leg_bottom", "leg_top", "leg_side", "foot_top", "foot_bottom", "foot_ground", "foot_tip"];
const GEO = {};
export async function loadParts(base = "assets/mesh/") {
  await Promise.all(PARTS.map(async (n) => {
    const buf = await (await fetch(`${base}${n}.bin`)).arrayBuffer();
    const [nv, nf] = new Uint32Array(buf, 0, 2);
    const pos = new Float32Array(buf, 8, nv * 3), idx = new Uint32Array(buf, 8 + nv * 12, nf * 3);
    let g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g = toCreasedNormals(g, Math.PI / 7);   // CAD look: sharp edges, smooth fillets
    GEO[n] = g;
  }));
}

// rows R (local -> frame) + translation t
function mk(R, t) {
  const m = new THREE.Matrix4();
  m.set(R[0][0], R[0][1], R[0][2], t[0], R[1][0], R[1][1], R[1][2], t[1], R[2][0], R[2][1], R[2][2], t[2], 0, 0, 0, 1);
  return m;
}
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const XZY = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];

// materials matching the real printed robot (photo): cream head, charcoal body, mint joints & legs, magenta feet
export function makeMaterials() {
  const std = (color, rough = 0.42, metal = 0.0, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: metal, clearcoat: 0.25, clearcoatRoughness: 0.5, side: THREE.DoubleSide, ...extra });
  return {
    head: std(0xcfc6b4, 0.55), body: std(0x24262b, 0.55), bodyTop: std(0x2b2e34, 0.5),
    joint: std(0x63c99a, 0.45), leg: std(0x74d6a6, 0.42), foot: std(0xd81f7c, 0.4), tip: std(0x1c1c20, 0.7),
    servo: std(0x2456c8, 0.35), servoCap: std(0x121316, 0.45), spline: std(0xd8d8d8, 0.25, 0.9),
    horn: std(0x0d0d0f, 0.5), screw: std(0xb8bcc4, 0.25, 0.95),
  };
}

// Each assembled part is a node: mesh with its home matrix inside a kinematic group, plus assembly metadata
// (when it flies in, from where). Assembly offsets are applied in the parent frame.
class Part {
  constructor(parent, mesh, home, meta) {
    this.mesh = mesh; this.home = home.clone(); this.meta = meta;
    mesh.matrixAutoUpdate = false; mesh.matrix.copy(home);
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh);
  }
}

function servoGroup(mat) {
  // MG92B-sized micro servo, shaft at origin pointing +z, body below; x = along servo (shaft end at -x side)
  const g = new THREE.Group();
  const box = (w, d, h, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  box(22.5, 12, 18.5, 5.25, 0, -18.5 / 2 - 6.2, mat.servo);         // lower case (blue)
  box(32.5, 12, 1.6, 5.25, 0, -6.2 + 0.8 - 1.6, mat.servo);          // mounting flange
  box(22.5, 12, 4.6, 5.25, 0, -2.3 - 1.6, mat.servoCap);             // upper case (black)
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(5.9, 5.9, 1.6, 28), mat.servoCap); dome.rotation.x = Math.PI / 2; dome.position.z = -0.8; g.add(dome);
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 3.2, 16), mat.spline); sp.rotation.x = Math.PI / 2; sp.position.z = 1.0; g.add(sp);
  return g;
}
function hornGroup(mat) {
  // two-arm servo horn with its screws, lying in the xy plane (thickness +z)
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.absarc(-9, 0, 2.6, Math.PI / 2, -Math.PI / 2, false); shape.lineTo(0, -3.6); shape.absarc(9, 0, 2.6, -Math.PI / 2, Math.PI / 2, false); shape.lineTo(0, 3.6); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.8, bevelEnabled: false, curveSegments: 10 });
  const h = new THREE.Mesh(geo, mat.horn); h.castShadow = true; g.add(h);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 3.6, 20), mat.horn); hub.rotation.x = Math.PI / 2; hub.position.z = 1.0; g.add(hub);
  for (const x of [-9, 9, 0]) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(x ? 1.7 : 2.2, x ? 1.7 : 2.2, 1.6, 6), mat.screw); s.rotation.x = Math.PI / 2; s.position.set(x, 0, x ? 2.6 : 3.4); g.add(s);
  }
  return g;
}

export function buildRobot(mat) {
  const root = new THREE.Group();          // world placement of the body (lift / walk / tilt)
  const body = new THREE.Group(); root.add(body);
  const parts = [];
  const add = (parent, geoName, home, m, meta) => { const mesh = new THREE.Mesh(GEO[geoName], m); const p = new Part(parent, mesh, home, meta); parts.push(p); return p; };
  const addObj = (parent, obj, home, meta) => { const p = new Part(parent, obj, home, meta); parts.push(p); return p; };

  // ---- body ----
  add(body, "body_base", mk(XZY, [-91.8, 83.65, -0.3]), mat.body, { stage: "base", dir: [0, 0, -1], dist: 160 });
  for (let k = 0; k < 6; k++) {
    const phi = THREE.MathUtils.degToRad(30 + 60 * k);
    const W = new THREE.Matrix4().makeRotationZ(phi).multiply(mk([[0, 1, 0], [-1, 0, 0], [0, 0, 1]], [66, 18, 3.6]));
    add(body, "body_side", W, mat.body, { stage: "walls", k, dir: [Math.cos(phi), Math.sin(phi), 0.3], dist: 140 });
  }
  const legs = [];
  LEG_ANGLES.forEach((deg, i) => {
    const a = THREE.MathUtils.degToRad(deg);
    const M = new THREE.Matrix4().makeRotationZ(a);
    const radial = [Math.cos(a), Math.sin(a), 0];
    // coxa servo standing in the body, clamped by two servo-side plates
    const cs = servoGroup(mat);
    const csHome = M.clone().multiply(new THREE.Matrix4().makeTranslation(DIM.mountR, 0, 32.4)).multiply(new THREE.Matrix4().makeRotationZ(Math.PI));
    addObj(body, cs, csHome, { stage: "coxaServo", i, dir: [radial[0], radial[1], 1.4], dist: 150 });
    add(body, "body_servo_side", M.clone().multiply(mk(I3, [0, 6, 6.9])), mat.body, { stage: "clamps", i, dir: [-Math.sin(a), Math.cos(a), 0.2], dist: 90 });
    add(body, "body_servo_side", M.clone().multiply(mk(I3, [0, -10, 6.9])), mat.body, { stage: "clamps", i, dir: [Math.sin(a), -Math.cos(a), 0.2], dist: 90 });

    // coxa frame: rotates about the vertical servo axis
    const coxa = new THREE.Group(); coxa.position.set(DIM.mountR * Math.cos(a), DIM.mountR * Math.sin(a), DIM.coxaZ); coxa.rotation.z = a; body.add(coxa);
    const jm = { stage: "joint", i };
    add(coxa, "joint_cross", mk([[0, 0, 1], [1, 0, 0], [0, 1, 0]], [12, -58.42, -24.31]), mat.joint, { ...jm, dir: [1, 0, 0], dist: 120 });
    add(coxa, "joint_top", mk([[-1, 0, 0], [0, -1, 0], [0, 0, 1]], [22.98, 7.46, 17.3]), mat.joint, { ...jm, dir: [0, 0, 1], dist: 90, delay: 0.08 });
    add(coxa, "joint_bottom", mk([[-1, 0, 0], [0, 1, 0], [0, 0, -1]], [23.02, -7.51, -17.3]), mat.joint, { ...jm, dir: [0, 0, -1], dist: 90, delay: 0.08 });
    add(coxa, "joint_top", mk([[1, 0, 0], [0, 0, 1], [0, -1, 0]], [13.02, 17.3, 7.46]), mat.joint, { ...jm, dir: [0, 1, 0], dist: 90, delay: 0.16 });
    add(coxa, "joint_bottom", mk([[1, 0, 0], [0, 0, -1], [0, 1, 0]], [12.98, -17.3, -7.51]), mat.joint, { ...jm, dir: [0, -1, 0], dist: 90, delay: 0.16 });
    // coxa horn on top of the upper ear, femur horn outside the side ear
    addObj(coxa, hornGroup(mat), new THREE.Matrix4().makeTranslation(0, 0, 20.7).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2)), { stage: "horns", i, dir: [0, 0, 1], dist: 60 });
    addObj(coxa, hornGroup(mat), new THREE.Matrix4().makeTranslation(DIM.coxa, 20.7, 0).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)), { stage: "horns", i, dir: [0, 1, 0], dist: 60, delay: 0.1 });

    // femur: the green servo box (holds femur + tibia servos)
    const femur = new THREE.Group(); femur.position.set(DIM.coxa, 0, 0); coxa.add(femur);
    const L = new THREE.Group(); L.matrixAutoUpdate = false; L.matrix.copy(mk([[1, 0, 0], [0, 0, 1], [0, -1, 0]], [0, -DIM.clamp, 0])); femur.add(L);
    const lm = { stage: "leg", i };
    add(L, "leg_bottom", mk(XZY, [-10.53, 11.27, -5.3]), mat.leg, { ...lm, dir: [0, 0, -1], dist: 70, delay: 0.0 });
    addObj(L, servoGroup(mat), new THREE.Matrix4().makeTranslation(0, 0, 29.6), { ...lm, dir: [0, 0, 1], dist: 80, delay: 0.1 });
    addObj(L, servoGroup(mat), new THREE.Matrix4().makeTranslation(DIM.femur, 0, 29.6).multiply(new THREE.Matrix4().makeRotationZ(Math.PI)), { ...lm, dir: [0, 0, 1], dist: 80, delay: 0.16 });
    add(L, "leg_side", mk(XZY, [-10.45, 11.2, 0]), mat.leg, { ...lm, dir: [0, 1, 0], dist: 60, delay: 0.26 });
    add(L, "leg_side", mk([[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [54.05, -11.2, 0]), mat.leg, { ...lm, dir: [0, -1, 0], dist: 60, delay: 0.3 });
    add(L, "leg_top", mk(I3, [-10.53, -28.43, -25.9]), mat.leg, { ...lm, dir: [0, 0, 1], dist: 70, delay: 0.38 });

    // tibia: the magenta foot, pivoting on the tibia servo
    const tibia = new THREE.Group(); tibia.position.set(DIM.femur, 0, DIM.clamp); L.add(tibia);
    const fm = { stage: "foot", i };
    add(tibia, "foot_ground", mk(XZY, [17.5, 2, -19.75]), mat.foot, { ...fm, dir: [1, 0, 0], dist: 90 });
    add(tibia, "foot_top", mk(XZY, [-14.46, 7.52, 17.3]), mat.foot, { ...fm, dir: [0, 0, 1], dist: 60, delay: 0.1 });
    add(tibia, "foot_bottom", mk(XZY, [-8.0, 7.97, -56.8]), mat.foot, { ...fm, dir: [0, 0, -1], dist: 60, delay: 0.1 });
    add(tibia, "foot_tip", mk(XZY, [57.2, 6, -19.7]), mat.tip, { ...fm, dir: [1, 0, 0], dist: 50, delay: 0.2 });
    addObj(tibia, hornGroup(mat), new THREE.Matrix4().makeTranslation(0, 0, 20.7), { ...fm, dir: [0, 0, 1], dist: 40, delay: 0.25 });

    legs.push({ a, coxa, femur, tibia, L });
  });
  add(body, "body_top", mk(I3, [-91.8, -83.65, 29.5]), mat.bodyTop, { stage: "top", dir: [0, 0, 1], dist: 140 });
  add(body, "body_head", mk(I3, [-66, -66, 32.6]), mat.head, { stage: "head", dir: [0, 0, 1], dist: 220 });

  // ---- pose: joint angles in radians (coxa yaw, femur lift up+, tibia bend down+) ----
  function setPose(angles) {
    legs.forEach((l, i) => {
      const [t1, t2, t3] = angles[i];
      l.coxa.rotation.z = l.a + t1;
      l.femur.rotation.set(0, -t2, 0);
      l.tibia.rotation.set(0, 0, t3);
    });
  }
  // ---- assembly: progress(part) -> 0 (away) .. 1 (home) ----
  function setAssembly(progressOf) {
    for (const p of parts) {
      const k = progressOf(p.meta);
      p.mesh.visible = k > 0.001;
      if (k >= 1) { p.mesh.matrix.copy(p.home); continue; }
      const e = 1 - k;
      const d = p.meta.dir, n = Math.hypot(...d) || 1, dist = p.meta.dist * e * e;
      const off = new THREE.Matrix4().makeTranslation(d[0] / n * dist, d[1] / n * dist, d[2] / n * dist);
      const spin = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(...d).normalize(), e * e * (p.meta.spin ?? 1.2));
      // spin about the part's own home position
      const pos = new THREE.Vector3().setFromMatrixPosition(p.home);
      const aroundHome = new THREE.Matrix4().makeTranslation(pos.x, pos.y, pos.z).multiply(spin).multiply(new THREE.Matrix4().makeTranslation(-pos.x, -pos.y, -pos.z));
      p.mesh.matrix.copy(off).multiply(aroundHome).multiply(p.home);
    }
  }
  return { root, body, legs, parts, setPose, setAssembly };
}

// planar IK of one leg; target in the coxa plane: r = radial distance from the femur axis, z = height relative to it
export function legIK(r, z) {
  const a = DIM.femur, b = DIM.tibia;
  const d = Math.min(Math.hypot(r, z), a + b - 0.01);
  const c3 = (a * a + b * b - d * d) / (2 * a * b);
  const knee = Math.PI - Math.acos(Math.max(-1, Math.min(1, c3)));   // bend between femur and tibia
  const t2 = Math.atan2(z, r) + Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  return [t2, knee];
}
