// Las cinco escenas 3D del spot. Cada una expone update(t, cam) y devuelve ajustes de posproducción.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp, prog, ease, rng, noise1, flicker, AMBER, GOLD, FLOOR_T } from './util.js';
import * as TX from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hdr = (hex, k) => new THREE.Color(hex).multiplyScalar(k);
const basic = (hex, k = 1, extra = {}) => new THREE.MeshBasicMaterial({ color: hdr(hex, k), ...extra });
const OVERLAY_LAYER = 1; // capa que el espejo del suelo no ve

function shake(cam, amp, t, f = 9) {
  if (amp <= 0) return;
  cam.position.x += noise1(t * f) * amp;
  cam.position.y += noise1(t * f + 40) * amp;
}
function look(cam, p, target, fov) {
  cam.up.set(0, 1, 0);
  cam.position.copy(p);
  cam.lookAt(target);
  cam.userData.fov = fov;
}

// Suelo negro mojado: espejo + manchas secas que rompen el reflejo
function wetFloor(scene, { size = 80, dim = 0x333333, res = 1024 } = {}) {
  const geo = new THREE.PlaneGeometry(size, size);
  const mirror = new Reflector(geo, { clipBias: 0.003, textureWidth: res, textureHeight: res, color: dim });
  mirror.rotation.x = -Math.PI / 2;
  scene.add(mirror);
  const over = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, alphaMap: TX.wetMask(), depthWrite: false }));
  over.rotation.x = -Math.PI / 2;
  over.position.y = 0.003;
  over.layers.set(OVERLAY_LAYER);
  scene.add(over);
  return mirror;
}

// Silueta humana sobria (se lee por la luz de contorno, nunca de frente)
function figure() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0x121010, roughness: 0.7, metalness: 0.0 });
  const add = (geo, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); g.add(o); return o; };
  add(new THREE.SphereGeometry(0.105, 24, 18), 0, 1.66, 0, 0.92, 1.08, 1);
  add(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 12), 0, 1.53, 0);
  add(new THREE.CapsuleGeometry(0.16, 0.42, 6, 16), 0, 1.2, 0, 1.25, 1, 0.68);
  add(new THREE.CapsuleGeometry(0.14, 0.12, 6, 16), 0, 0.92, 0, 1.2, 1, 0.7);
  for (const s of [-1, 1]) add(new THREE.CapsuleGeometry(0.07, 0.72, 6, 12), s * 0.1, 0.47, 0);
  const arms = [-1, 1].map(s => {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.25, 1.45, 0);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.56, 6, 12), m);
    a.position.y = -0.32;
    pivot.add(a);
    g.add(pivot);
    return pivot;
  });
  g.userData.armL = arms[0];
  g.userData.armR = arms[1];
  return g;
}

function spot(color, intensity, pos, target, angle = 0.5, penumbra = 0.6) {
  const s = new THREE.SpotLight(color, intensity, 0, angle, penumbra, 2);
  s.position.copy(pos);
  s.target.position.copy(target);
  s.userData.base = intensity;
  return s;
}

// Portátil de alta ingeniería: base, tapa con bisagra, pantalla y bordes de luz
function laptop(screenTex) {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x1a1a1d, metalness: 0.9, roughness: 0.3 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.045, 0.95, 4, 0.014), metal);
  base.position.y = 0;
  group.add(base);
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.76), new THREE.MeshStandardMaterial({ map: TX.keyboard(), roughness: 0.5, metalness: 0.4 }));
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(0, 0.0231, 0.05);
  group.add(keys);
  const pivot = new THREE.Group();
  pivot.position.set(0, 0.0225, -0.475);
  group.add(pivot);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.026, 0.95, 4, 0.012), metal);
  lid.position.set(0, 0.014, 0.475);
  pivot.add(lid);
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, color: new THREE.Color(0, 0, 0), toneMapped: true });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.84), screenMat);
  screen.rotation.x = Math.PI / 2;
  screen.position.set(0, -0.0008, 0.475);
  pivot.add(screen);
  // Bordes de luz ámbar: cada tramo crece desde su origen
  const edgeMat = basic(AMBER, 2.4);
  const seg = (len, axis) => {
    const geo = new THREE.BoxGeometry(axis === 'x' ? len : 0.006, 0.006, axis === 'z' ? len : 0.006);
    geo.translate(axis === 'x' ? len / 2 : 0, 0, axis === 'z' ? len / 2 : 0);
    const m = new THREE.Mesh(geo, edgeMat);
    m.userData.axis = axis;
    return m;
  };
  const edges = [];
  const e0 = seg(1.4, 'x'); e0.position.set(-0.7, 0, 0.476); group.add(e0); edges.push(e0);
  const e1 = seg(0.95, 'z'); e1.position.set(0.701, 0.028, 0); e1.scale.z = -1; e1.position.z = 0.95; pivot.add(e1); edges.push(e1);
  const e2 = seg(1.4, 'x'); e2.position.set(0.7, 0.028, 0.951); e2.scale.x = -1; pivot.add(e2); edges.push(e2);
  const e3 = seg(0.95, 'z'); e3.position.set(-0.701, 0.028, 0.95); e3.scale.z = -1; pivot.add(e3); edges.push(e3);
  const status = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.004, 0.004), basic(AMBER, 5));
  status.position.set(0, -0.004, 0.477);
  group.add(status);
  return { group, pivot, screen, screenMat, edges, status, metal };
}
function setEdges(edges, p) {
  edges.forEach((e, i) => {
    const s = clamp(p * edges.length - i);
    const v = Math.max(s, 0.0001);
    if (e.userData.axis === 'x') e.scale.x = Math.sign(e.scale.x || 1) * v;
    else e.scale.z = Math.sign(e.scale.z || 1) * v;
    e.visible = s > 0;
  });
}

/* ======================= S1 · EL IMPACTO (0–8 s) ======================= */
export function buildStorm(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0);
  scene.fog = new THREE.FogExp2(0x000000, 0.06);
  wetFloor(scene, { dim: 0x2c2c2c });
  const fig = figure();
  scene.add(fig);
  const rimA = spot(AMBER, 120, V(-1.6, 3.2, -2.6), V(0, 1.2, 0), 0.45);
  const rimB = spot(0xffd9a8, 60, V(1.9, 2.8, -2.3), V(0, 1.2, 0), 0.5);
  const top = spot(0xfff1dc, 5, V(0, 6, -0.6), V(0, 0, 0), 0.32, 0.8);
  [rimA, rimB, top].forEach(l => { scene.add(l, l.target); });

  const P0 = V(0, 1.55, 1.3);
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 16), basic(AMBER, 10));
  pulse.position.copy(P0);
  scene.add(pulse);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glow(), color: hdr(AMBER, 2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.copy(P0);
  scene.add(halo);

  // La chispa se convierte en la palabra VENDER, que luego estalla y orbita
  const pts = TX.textPoints('VENDER', 0.00082, 4);
  const r = rng(5);
  const data = pts.map(([wx, wy]) => ({
    wx, wy, d: r(), vx: r() - 0.5, vy: r() - 0.5, vz: r() - 0.3,
    or: 1.1 + r() * 2.7, oy: 0.1 + r() * 3.1, oa: r() * 6.283, ok: 0.55 + r() * 0.9,
    jx: r() - 0.5, jy: r() - 0.5, jz: r() - 0.5,
  }));
  const N = data.length;
  const pos = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pmat = new THREE.PointsMaterial({ size: 0.009, map: TX.dot(), color: new THREE.Color(1.25, 1.05, 0.85), transparent: true, depthWrite: false, opacity: 0 });
  const points = new THREE.Points(geo, pmat);
  points.frustumCulled = false;
  scene.add(points);

  const names = ['PPC', 'BENEFICIO', 'INVENTARIO', 'IMÁGENES', 'FICHAS', 'CUENTA', 'IVA'];
  const words = names.map((n, i) => {
    const t = TX.word(n, i % 3 === 0 ? '#ffb24d' : '#f4efe6');
    const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, color: new THREE.Color(1.5, 1.5, 1.5), opacity: 0 });
    const s = new THREE.Sprite(m);
    const h = 0.3;
    s.scale.set(h * t.userData.aspect, h, 1);
    scene.add(s);
    return { s, r: 1.45 + (i % 4) * 0.5, y: 0.55 + ((i * 0.61) % 2.3), a: i * 0.9, k: 0.85 + (i % 3) * 0.2, tin: 3.0 + i * 0.22 };
  });

  // Ángulo acumulado: la órbita acelera hasta la tormenta
  const PHI = t => {
    const e = Math.max(0, t - 2.6), D = 4.4, u = Math.min(e, D);
    let a = 0.35 * e + (3.2 * u * u * u) / (3 * D * D);
    if (e > D) a += 3.2 * (e - D);
    return a;
  };

  const update = (t, cam) => {
    // Pulso inicial
    const pOn = prog(t, 0.4, 0.5) * (1 - prog(t, 1.05, 1.4));
    const beat = 1 + 0.5 * Math.exp(-((t - 0.4) % 10) * 5) * (t > 0.4 ? 1 : 0);
    pulse.visible = pOn > 0;
    pulse.scale.setScalar(beat * (0.6 + 0.4 * pOn));
    halo.material.opacity = pOn * 0.9;
    halo.scale.setScalar(0.5 * beat + 0.15 * Math.sin(t * 9));

    const phi = PHI(t);
    for (let i = 0; i < N; i++) {
      const q = data[i];
      const wx = q.wx, wy = P0.y + q.wy, wz = P0.z;
      let x, y, z;
      if (t < 2.6) {
        const p = ease.out(prog(t, 0.85 + q.d * 0.35, 1.55 + q.d * 0.35));
        const sp = (1 - p) * 0.5;
        x = lerp(P0.x, wx, p) + q.jx * sp; y = lerp(P0.y, wy, p) + q.jy * sp; z = lerp(P0.z, wz, p) + q.jz * sp;
        y += Math.sin(t * 17 + i) * 0.0012;
      } else {
        const e = t - 2.6, k = 1 - Math.exp(-e * 2.6);
        const ex = wx + q.vx * 2.4 * k, ey = wy + q.vy * 1.6 * k, ez = wz + q.vz * 2.0 * k;
        const ang = q.oa + phi * q.ok;
        const ox = Math.cos(ang) * q.or, oz = Math.sin(ang) * q.or, oy = q.oy + Math.sin(t * 1.3 + q.oa) * 0.15;
        const b = ease.inOut(prog(t, 2.85 + q.d * 0.4, 4.3 + q.d * 0.4));
        x = lerp(ex, ox, b); y = lerp(ey, oy, b); z = lerp(ez, oz, b);
      }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    }
    geo.attributes.position.needsUpdate = true;
    pmat.opacity = prog(t, 0.85, 1.05) * (1 - prog(t, 7.0, 7.5));
    pmat.size = t < 2.6 ? 0.009 : 0.014;

    words.forEach((w, i) => {
      const ang = w.a + phi * w.k;
      w.s.position.set(Math.cos(ang) * w.r, w.y + Math.sin(t * 0.9 + i) * 0.12, Math.sin(ang) * w.r);
      w.s.material.opacity = ease.out(prog(t, w.tin, w.tin + 0.5)) * (1 - prog(t, 7.0, 7.4));
    });

    const L = ease.out(prog(t, 2.6, 3.5)) * (1 - prog(t, 7.1, 7.5));
    rimA.intensity = rimA.userData.base * L * (1 + 0.25 * noise1(t * 6));
    rimB.intensity = rimB.userData.base * L;
    top.intensity = top.userData.base * L;

    // Cámara: frontal y quieta → giro que acelera hasta rozar las palabras
    if (t < 2.6) {
      look(cam, V(0, 1.55, lerp(5.6 * ctx.F, 4.7 * ctx.F, ease.sine(prog(t, 0, 2.6)))), P0, 40);
    } else {
      const e = t - 2.6;
      const psi = -0.22 * e - 0.55 * Math.pow(prog(t, 2.6, 7), 2) * e;
      const R = lerp(4.7 * ctx.F, 2.75 * ctx.F, ease.inOut(prog(t, 2.6, 6.4)));
      const h = 1.45 + Math.sin(e * 0.8) * 0.35;
      const tgt = V(0, 1.55, 1.3).lerp(V(0, 1.25, 0), ease.inOut(prog(t, 2.6, 3.8)));
      look(cam, V(Math.sin(psi) * R, h, Math.cos(psi) * R), tgt, 40 + 8 * prog(t, 4, 7));
      const roll = Math.sin(e * 0.7) * 0.14 * prog(t, 3.2, 7);
      cam.rotateZ(roll);
    }
    if (t > 7.0) shake(cam, 0.09 * Math.exp(-(t - 7.0) * 7), t, 30);
    return { bloom: t < 2.6 ? 0.55 : 0.8, threshold: 0.9, fade: prog(t, 7.3, 7.62), grain: 0.07 };
  };
  return { scene, update };
}

/* ======================= S2 · EL PORTAL (8–15 s) ======================= */
export function buildPortal(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0);
  scene.fog = new THREE.FogExp2(0x000000, 0.08);
  scene.environment = ctx.envRoom;
  scene.environmentIntensity = 0.6;
  wetFloor(scene, { dim: 0x353535 });
  const portalTex = TX.portal();
  const lap = laptop(portalTex);
  lap.group.position.set(0, 0.55, 0);
  scene.add(lap.group);
  const key = spot(0xfff0dd, 110, V(2.2, 4.2, 2.8), V(0, 0.5, 0), 0.38, 0.9);
  const rim = spot(0xffc68a, 160, V(-1.5, 2.5, -3), V(0, 0.6, 0), 0.5, 0.7);
  scene.add(key, key.target, rim, rim.target);
  const screenLight = new THREE.PointLight(AMBER, 0, 0, 2);
  scene.add(screenLight);
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: TX.glow(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(0, 0.01, 1.2);
  spill.layers.set(OVERLAY_LAYER);
  scene.add(spill);

  const sc = new THREE.Vector3(), sn = new THREE.Vector3(), q = new THREE.Quaternion();
  const update = (t, cam) => {
    lap.group.position.y = 0.55 + Math.sin(t * 1.1) * 0.008;
    // Apertura mecánica en dos tiempos (desbloqueo y recorrido)
    const theta = 0.22 * ease.inOut(prog(t, 9.5, 9.85)) + (1.85 - 0.22) * ease.inOut(prog(t, 10.05, 11.15));
    lap.pivot.rotation.x = -theta;
    lap.screen.visible = theta > 0.05;
    lap.status.material.color.copy(hdr(AMBER, 5 * (0.4 + 0.6 * Math.abs(Math.sin(t * 2.2)))));
    setEdges(lap.edges, ease.inOut(prog(t, 10.4, 11.5)));

    const bright = ease.inOut(prog(t, 11.2, 12.6)) + 0.6 * ease.in(prog(t, 13.2, 14.8));
    const zoom = 0.12 * Math.max(0, t - 11) + 2.4 * ease.in(prog(t, 12.6, 14.8));
    portalTex.userData.draw(zoom, clamp(bright));
    lap.screenMat.color.setScalar(0.15 * prog(t, 10.8, 11.3) + 2.2 * bright);

    lap.group.updateMatrixWorld(true);
    lap.screen.getWorldPosition(sc);
    lap.screen.getWorldQuaternion(q);
    sn.set(0, 0, 1).applyQuaternion(q);
    screenLight.position.copy(sc).addScaledVector(sn, 0.4);
    screenLight.intensity = 9 * bright;
    spill.material.opacity = 0.45 * clamp(bright);

    let p, tg, fov = 38;
    if (t < 12.6) {
      const a = ease.sine(prog(t, 8, 12.6));
      p = V(0.2 * (1 - a), lerp(2.1, 1.25, a), lerp(6.0, 3.0, a) * ctx.F);
      tg = V(0, lerp(0.6, 0.85, ease.inOut(prog(t, 9.8, 11.6))), lerp(0, -0.25, a));
    } else {
      const a = ease.in(prog(t, 12.6, 14.85));
      const start = V(0, 1.25, 3.0 * ctx.F);
      const end = sc.clone().addScaledVector(sn, 0.03);
      p = start.lerp(end, a);
      tg = V(0, 0.85, -0.25).lerp(sc.clone().addScaledVector(sn, -1), ease.out(prog(t, 12.6, 13.4)));
      fov = 38 + 34 * a;
    }
    look(cam, p, tg, fov);
    return { bloom: 0.6 + 1.2 * clamp(bright), threshold: 0.92 - 0.2 * clamp(bright), flash: ease.in(prog(t, 14.45, 14.98)), flashColor: [1, 0.86, 0.66], grain: 0.06 };
  };
  return { scene, update };
}

/* ======================= S3 · EL VENDEDOR CONTRA OCHO (15–22 s) ======================= */
export function buildAlone(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020101);
  scene.fog = new THREE.FogExp2(0x030201, 0.03);
  scene.environment = ctx.envRoom;
  scene.environmentIntensity = 0.05;
  wetFloor(scene, { dim: 0x3a3a3a, size: 120 });
  const conc = new THREE.MeshStandardMaterial({ color: 0x5a5550, map: TX.concrete(4), roughness: 0.95 });
  for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 44, 1.5), conc);
    p.position.set(sx * 8, 22, 10 - i * 7);
    scene.add(p);
  }
  const fig = figure();
  scene.add(fig);
  const top = spot(0xfff3e2, 120, V(0, 9, 0.4), V(0, 0, 0), 0.22, 0.6);
  const rim = spot(AMBER, 110, V(0, 3.5, -3.5), V(0, 1.3, 0), 0.5, 0.6);
  const red1 = new THREE.PointLight(0xff4a22, 0, 0, 2); red1.position.set(-4, 3, 2);
  const red2 = new THREE.PointLight(0xff8a2a, 0, 0, 2); red2.position.set(4, 4, -2);
  scene.add(top, top.target, rim, rim.target, red1, red2);

  // Paneles: 8 tipos × (60 que se multiplican + 300 del muro gigante)
  const geo = new THREE.PlaneGeometry(0.8, 0.5);
  const STORM = 60, WALL = 300;
  const rnd = rng(21);
  const meshes = [], wallMeshes = [], wallMats = [];
  const seeds = Array.from({ length: 8 * STORM }, () => [rnd(), rnd(), rnd(), rnd()]);
  for (let k = 0; k < 8; k++) {
    const map = TX.panel(k);
    const m = new THREE.MeshBasicMaterial({ map, transparent: true, side: THREE.DoubleSide, depthWrite: false, color: new THREE.Color(1.35, 1.35, 1.35) });
    const im = new THREE.InstancedMesh(geo, m, STORM);
    im.frustumCulled = false;
    scene.add(im);
    meshes.push(im);
    const wm = m.clone();
    wm.opacity = 0;
    const wim = new THREE.InstancedMesh(geo, wm, WALL);
    wim.frustumCulled = false;
    scene.add(wim);
    wallMeshes.push(wim);
    wallMats.push(wm);
  }
  // El muro es estático: se coloca una sola vez
  const d = new THREE.Object3D();
  for (let k = 0; k < 8; k++) for (let j = 0; j < WALL; j++) {
    const w = j * 8 + k, col = w % 96, row = Math.floor(w / 96);
    const a = (col / 96) * Math.PI * 2;
    d.position.set(Math.cos(a) * 15, 0.8 + row * 1.15, Math.sin(a) * 15);
    d.lookAt(0, d.position.y, 0);
    d.scale.setScalar(1.6);
    d.updateMatrix();
    wallMeshes[k].setMatrixAt(j, d.matrix);
  }
  wallMeshes.forEach(m => (m.instanceMatrix.needsUpdate = true));

  const spawnT = g => (g < 8 ? 15.25 + g * 0.07 : 16.1 + 0.56 * Math.log2(g / 8));

  const update = (t, cam) => {
    for (let k = 0; k < 8; k++) {
      for (let j = 0; j < STORM; j++) {
        const g = j * 8 + k, s = seeds[g];
        const st = spawnT(g);
        const sc = t < st ? 0 : ease.expoOut(prog(t, st, st + 0.3));
        const rr = 1.6 + (g / 480) * 4.2 + s[0] * 0.8;
        const a = s[1] * Math.PI * 2 + (t - 15) * (0.05 + s[3] * 0.15) * (g % 2 ? 1 : -1);
        const y = 0.6 + s[2] * 3.2 + (g / 480) * 2.4;
        d.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr);
        d.lookAt(Math.cos(a) * rr * 2, y, Math.sin(a) * rr * 2);
        d.rotateY(Math.sin(t * 0.8 + g) * 0.35);
        d.rotateZ(Math.sin(t * 0.5 + g * 1.7) * 0.12);
        d.scale.setScalar(Math.max(sc, 0.0001));
        d.updateMatrix();
        meshes[k].setMatrixAt(j, d.matrix);
      }
      meshes[k].instanceMatrix.needsUpdate = true;
      wallMats[k].opacity = 0.85 * ease.inOut(prog(t, 19.2, 20.8));
    }
    // Intento de alcanzar los paneles
    const reachR = ease.inOut(prog(t, 16.3, 16.8)) - ease.inOut(prog(t, 17.3, 17.7)) + ease.inOut(prog(t, 18.3, 18.9));
    const reachL = ease.inOut(prog(t, 17.2, 17.7)) - ease.inOut(prog(t, 18.0, 18.3)) + ease.inOut(prog(t, 18.4, 19.0));
    fig.userData.armR.rotation.set(-1.25 * reachR, 0, 0.35 * reachR);
    fig.userData.armL.rotation.set(-1.15 * reachL, 0, -0.45 * reachL);
    fig.rotation.y = Math.sin(t * 1.3) * 0.35 * prog(t, 16, 18);

    const aggr = prog(t, 16.4, 19.0);
    const fl = 0.55 + 0.45 * noise1(t * 14);
    red1.intensity = 60 * aggr * fl;
    red2.intensity = 50 * aggr * (0.55 + 0.45 * noise1(t * 11 + 9));
    top.intensity = top.userData.base * (1 - 0.4 * aggr * (0.5 + 0.5 * noise1(t * 20)));
    rim.intensity = rim.userData.base * (0.7 + 0.6 * aggr);

    if (t < 19.4) {
      const a = 0.55 + (t - 15) * 0.14;
      const R = lerp(4.4, 3.5, prog(t, 15, 19.4)) * ctx.F;
      look(cam, V(Math.sin(a) * R, 1.65, Math.cos(a) * R), V(0, 1.4, 0), 42);
      shake(cam, 0.008 + 0.04 * aggr, t, 7);
    } else {
      const a = ease.inOut(prog(t, 19.4, 21.95));
      const a0 = 0.55 + 4.4 * 0.14;
      const R0 = 3.5 * ctx.F;
      const p0 = V(Math.sin(a0) * R0, 1.65, Math.cos(a0) * R0);
      look(cam, p0.lerp(V(0, 11, 31 * ctx.F), a), V(0, 1.4, 0).lerp(V(0, 7, 0), a), 42 + 8 * a);
      shake(cam, 0.04 * (1 - a), t, 7);
    }
    return { bloom: 0.8 + 0.4 * aggr, threshold: 0.8, grain: 0.08, ca: 0.6 * aggr };
  };
  return { scene, update };
}

/* ======================= S4 · EL NACIMIENTO DE LA OFICINA (22–38 s) ======================= */
export function buildTower(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0);
  scene.fog = new THREE.FogExp2(0x020100, 0.016);
  scene.environment = ctx.envRoom;
  scene.environmentIntensity = 0.3;
  const mirror = wetFloor(scene, { size: 200, dim: 0x3c3c3c });
  const moon = new THREE.DirectionalLight(0x9db0cc, 2.6);
  moon.position.set(-20, 30, 10);
  scene.add(moon);
  const under = new THREE.PointLight(AMBER, 0, 0, 2);
  under.position.set(0, 0.5, 9);
  scene.add(under);
  const floorLight = new THREE.PointLight(0xffb560, 0, 0, 2);
  scene.add(floorLight);

  const tower = new THREE.Group();
  scene.add(tower);
  const cmap = TX.concrete(9);
  cmap.repeat.set(2, 1);
  const conc = new THREE.MeshStandardMaterial({ color: 0x74716d, map: cmap, roughness: 0.9 });
  const concDark = new THREE.MeshStandardMaterial({ color: 0x5f5c58, map: cmap, roughness: 0.95 });
  const W = 7, D = 7, H = 2.4;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 10), conc);
  plinth.position.y = 0.6;
  tower.add(plinth);
  const winTex = [], winFront = [], winSide = [], hazes = [];
  for (let i = 0; i < 8; i++) {
    const y0 = 1.2 + i * H;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(W + 1.1, 0.36, D + 1.1), conc);
    slab.position.set(i % 2 ? 0.35 : -0.35, y0 + H - 0.18, 0);
    tower.add(slab);
    const core = new THREE.Mesh(new THREE.BoxGeometry(W, H - 0.36, D), i % 2 ? conc : concDark);
    core.position.y = y0 + (H - 0.36) / 2;
    tower.add(core);
    const tx = TX.deptWindow(i);
    winTex.push(tx);
    const fm = new THREE.MeshBasicMaterial({ map: tx, color: new THREE.Color(0, 0, 0) });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.9, H - 1.05), fm);
    f.position.set(0, core.position.y, D / 2 + 0.02);
    tower.add(f);
    winFront.push(fm);
    const sm = new THREE.MeshBasicMaterial({ map: tx, color: new THREE.Color(0, 0, 0) });
    for (const s of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(D - 0.5, H - 0.75), sm);
      side.position.set(s * (W / 2 + 0.02), core.position.y, 0);
      side.rotation.y = s * Math.PI / 2;
      tower.add(side);
    }
    winSide.push(sm);
    for (const s of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.35, H - 0.36, 0.6), conc);
      fin.position.set(s * (W / 2 - 0.1), core.position.y, D / 2 + 0.3);
      tower.add(fin);
    }
    const hz = new THREE.Mesh(new THREE.PlaneGeometry(W + 6, 4.5), new THREE.MeshBasicMaterial({ map: TX.glow(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, color: hdr(AMBER, 1) }));
    hz.position.set(0, core.position.y, D / 2 + 1.2);
    hz.layers.set(OVERLAY_LAYER);
    tower.add(hz);
    hazes.push(hz);
  }
  const crownY = 1.2 + 8 * H;
  const crown = new THREE.Mesh(new THREE.BoxGeometry(W - 1.6, 2.6, D - 1.6), conc);
  crown.position.y = crownY + 1.3;
  tower.add(crown);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(W + 1.6, 0.4, D + 1.6), conc);
  deck.position.y = crownY + 2.8;
  tower.add(deck);

  // El director: núcleo geométrico de luz blanca
  const DIR = V(0, crownY + 5, 0);
  const director = new THREE.Group();
  director.position.copy(DIR);
  tower.add(director);
  const ico = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.25, 0)), new THREE.LineBasicMaterial({ color: new THREE.Color(3, 3, 3), transparent: true }));
  const coreM = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), basic(0xffffff, 2.5));
  const dHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glow('255,245,230'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  dHalo.scale.setScalar(3.2);
  director.add(ico, coreM, dHalo);
  const dLight = new THREE.PointLight(0xfff4e6, 0, 0, 2);
  director.add(dLight);

  // Líneas de luz del director a cada planta
  const lineMat = basic(0xffe2b8, 1.5);
  const curves = [], tubes = [];
  for (let i = 0; i < 8; i++) {
    const yi = 1.2 + i * H + (H - 0.36) / 2;
    const xo = (i % 2 ? 1 : -1) * (1.2 + (i % 4) * 0.6);
    const c = new THREE.CatmullRomCurve3([DIR.clone(), V(xo * 0.35, crownY + 2.4, D / 2 + 1.0), V(xo * 0.6, yi + 0.6, D / 2 + 0.55), V(xo * 0.5, yi, D / 2 + 0.08)]);
    const tg = new THREE.TubeGeometry(c, 80, 0.018, 6, false);
    const m = new THREE.Mesh(tg, lineMat);
    m.geometry.setDrawRange(0, 0);
    tower.add(m);
    curves.push(c);
    tubes.push(m);
  }
  const sparks = curves.map(() => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), basic(0xffffff, 8));
    tower.add(s);
    return s;
  });

  // Polvo que levanta el edificio al emerger
  const DN = 1400, dr = rng(31);
  const dust = Array.from({ length: DN }, () => [dr() * 6.283, 5 + dr() * 8, 1 + dr() * 5, dr() * 0.6, dr()]);
  const dpos = new Float32Array(DN * 3);
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dmat = new THREE.PointsMaterial({ size: 0.06, map: TX.dot(), color: new THREE.Color(1.4, 1.0, 0.7), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const dustPts = new THREE.Points(dgeo, dmat);
  dustPts.frustumCulled = false;
  scene.add(dustPts);

  const setLit = (t, sync) => {
    for (let i = 0; i < 8; i++) {
      const L = flicker(t - FLOOR_T[i]) * (t >= FLOOR_T[i] ? 1 : 0);
      winTex[i].userData.draw(Math.max(0, t - FLOOR_T[i]) + 0.4, L, sync);
      winFront[i].color.setScalar(L > 0 ? L * (1.6 + 1.6 * sync) : 1);
      winSide[i].color.setScalar(L > 0 ? L * 0.7 * (1 + sync) : 0.8);
      hazes[i].material.opacity = L * (0.18 + 0.5 * sync) + 0.6 * Math.exp(-Math.max(0, t - FLOOR_T[i]) * 4) * (t >= FLOOR_T[i] ? 1 : 0);
    }
  };

  const update = (t, cam) => {
    const rise = ease.out(prog(t, 22.2, 25.0));
    tower.position.y = lerp(-27, 0, rise);
    const rumble = prog(t, 22.0, 22.4) * (1 - prog(t, 24.6, 25.4));
    under.intensity = 380 * rumble;
    // Polvo
    for (let i = 0; i < DN; i++) {
      const q = dust[i], e = Math.max(0, t - 22.3 - q[3]);
      const r = q[1] + e * q[2] * 0.5, h = e * q[2] * 1.1 - 0.9 * e * e;
      dpos[i * 3] = Math.cos(q[0]) * r; dpos[i * 3 + 1] = Math.max(0.02, h); dpos[i * 3 + 2] = Math.sin(q[0]) * r;
    }
    dgeo.attributes.position.needsUpdate = true;
    dmat.opacity = prog(t, 22.3, 22.6) * (1 - prog(t, 24.5, 26.5));

    const sync = t > 37.3 ? Math.exp(-(t - 37.3) * 5) : 0;
    setLit(t, sync);
    // Luz que acompaña a la planta que se enciende
    const cur = clamp(Math.floor((t - FLOOR_T[0]) / 1.15), 0, 7);
    const sinceCur = t - FLOOR_T[cur];
    floorLight.position.set(0, 1.2 + cur * H + 1, D / 2 + 3);
    floorLight.intensity = t >= FLOOR_T[0] && t < 34 ? 30 + 220 * Math.exp(-sinceCur * 2.5) : 0;

    // Director
    const dOn = ease.expoOut(prog(t, 33.9, 34.6));
    director.visible = t > 33.85;
    director.scale.setScalar(0.2 + 0.8 * dOn + 0.15 * sync);
    ico.rotation.set(t * 0.3, t * 0.45, 0);
    coreM.rotation.set(-t * 0.6, t * 0.8, 0);
    dHalo.material.opacity = dOn * (0.45 + 0.15 * Math.sin(t * 3)) + 0.5 * sync;
    dLight.intensity = 80 * dOn + 200 * sync;
    tubes.forEach((m, i) => {
      const p = ease.inOut(prog(t, 34.5 + i * 0.12, 35.4 + i * 0.12));
      m.geometry.setDrawRange(0, Math.floor(m.geometry.index.count * p / 6) * 6);
      m.visible = p > 0;
    });
    sparks.forEach((s, i) => {
      const on = t > 35.6 + i * 0.12;
      s.visible = on;
      if (on) s.position.copy(curves[i].getPointAt(((t - 35.6) * 0.6 + i * 0.13) % 1));
    });

    // Cámara: plano bajo → ascenso por la fachada → director → gran plano general
    const F = ctx.F;
    if (t < 25.0) {
      const a = ease.sine(prog(t, 22, 25));
      look(cam, V(0, 0.8, 21 * F), V(0, lerp(4, 9, a), 0), 46);
      shake(cam, 0.07 * rumble, t, 18);
    } else if (t < 33.6) {
      const f = clamp((t - 25.0) / 1.15, 0, 7.6);
      const y = 2.2 + Math.min(f, 7.3) * H;
      const a = ease.inOut(prog(t, 25.0, 25.9));
      const p = V(Math.sin(f * 0.45) * 2.8 * F, y, 13 * F);
      const p0 = V(0, 0.8, 21 * F);
      look(cam, p0.lerp(p, a), V(0, lerp(9, y + 0.4, a), 0), 46);
    } else if (t < 35.0) {
      const a = ease.inOut(prog(t, 33.6, 35.0));
      const f = 7.3;
      const p0 = V(Math.sin(f * 0.45) * 2.8 * F, 2.2 + 7.3 * H, 13 * F);
      look(cam, p0.lerp(V(0, crownY + 1.5, 15 * F), a), V(0, lerp(2.6 + 7.3 * H, DIR.y, a), 0), 46);
    } else {
      const a = ease.inOut(prog(t, 35.0, 37.4));
      look(cam, V(0, crownY + 1.5, 15 * F).lerp(V(0, 12, 44 * F), a), DIR.clone().lerp(V(0, 12.5, 0), a), 46);
    }
    if (t >= 25.2 && t < 34) shake(cam, 0.05 * Math.exp(-((t - 25.2) % 1.15) * 8), t, 24);
    return { bloom: 0.9 + 0.5 * sync + 0.15 * dOn, threshold: 0.78, fade: prog(t, 37.5, 37.98), grain: 0.06 };
  };

  // Para el reflejo de la llave: captura del edificio encendido como entorno
  const captureEnv = renderer => {
    setLit(40, 0);
    director.visible = true; director.scale.setScalar(1);
    tower.position.set(0, -11, 17);
    mirror.visible = false;
    dustPts.visible = false;
    const pm = new THREE.PMREMGenerator(renderer);
    const env = pm.fromScene(scene, 0.02, 0.1, 200).texture;
    pm.dispose();
    mirror.visible = true;
    dustPts.visible = true;
    tower.position.set(0, 0, 0);
    return env;
  };
  return { scene, update, captureEnv };
}

/* ======================= S5–S7 · AMANECER, LLAVE Y REVELACIÓN (38–62 s) ======================= */
export function buildRoom(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0);
  scene.environment = ctx.envRoom;
  scene.environmentIntensity = 0.35;

  const fadeables = [];
  const mat = (o) => { const m = new THREE.MeshStandardMaterial({ transparent: true, ...o }); fadeables.push(m); return m; };
  const wallM = mat({ color: 0x6d655d, roughness: 0.95, map: TX.concrete(15) });
  const floorM = mat({ color: 0x2a1c13, roughness: 0.6 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorM);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const box = (w, h, d, x, y, z, m = wallM) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.receiveShadow = true; o.castShadow = true; scene.add(o); return o; };
  // Pared izquierda con ventana (hueco de 2,2 × 1,8 m)
  const WX = -2.5, wz0 = -0.3, wz1 = 1.9, wy0 = 0.85, wy1 = 2.65;
  box(0.2, wy0, 8, WX, wy0 / 2, 0);
  box(0.2, 3.2 - wy1, 8, WX, (wy1 + 3.2) / 2, 0);
  box(0.2, wy1 - wy0, wz0 + 4, WX, (wy0 + wy1) / 2, (wz0 - 4) / 2);
  box(0.2, wy1 - wy0, 4 - wz1, WX, (wy0 + wy1) / 2, (wz1 + 4) / 2);
  const mull = mat({ color: 0x111111, roughness: 0.4, metalness: 0.8 });
  box(0.08, wy1 - wy0, 0.05, WX, (wy0 + wy1) / 2, (wz0 + wz1) / 2, mull);
  box(0.08, 0.05, wz1 - wz0, WX, (wy0 + wy1) / 2 + 0.2, (wz0 + wz1) / 2, mull);
  box(5, 3.2, 0.2, 0, 1.6, -3);
  box(0.2, 3.2, 8, 2.5, 1.6, 0);
  box(5, 0.1, 8, 0, 3.2, 0);

  // Exterior: cielo de amanecer y sol
  const skyM = new THREE.MeshBasicMaterial({ map: TX.sky(), color: new THREE.Color(1.2, 1.2, 1.2), transparent: true });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(90, 50), skyM);
  sky.position.set(-40, 6, 0);
  sky.rotation.y = Math.PI / 2;
  scene.add(sky);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glow('255,220,160'), color: hdr(0xffffff, 3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sun.position.set(-38, 3.2, 1.2);
  sun.scale.setScalar(16);
  scene.add(sun);

  const sunLight = new THREE.DirectionalLight(0xffc27a, 7);
  sunLight.position.set(-9, 3.4, 1.4);
  sunLight.target.position.set(0, 0.6, 0.2);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -3; sunLight.shadow.camera.right = 3; sunLight.shadow.camera.top = 3; sunLight.shadow.camera.bottom = -3;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight, sunLight.target);
  const hemi = new THREE.HemisphereLight(0x9fb3d1, 0x3a2414, 0.35);
  scene.add(hemi);

  // Haces de luz atravesando la ventana
  const shaftT = TX.shaft();
  const shafts = [0, 1, 2].map(i => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 5), new THREE.MeshBasicMaterial({ map: shaftT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.22, side: THREE.DoubleSide }));
    s.position.set(-1.2, 1.4, 0.1 + i * 0.6);
    s.rotation.set(0, 0, -1.2);
    scene.add(s);
    return s;
  });

  // Escritorio, portátil y llave
  const wood = mat({ color: 0x3b2618, roughness: 0.42, metalness: 0.05 });
  const desk = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.04, 0.8, 3, 0.01), wood);
  desk.position.set(0, 0.75, 0);
  desk.castShadow = desk.receiveShadow = true;
  scene.add(desk);
  const legM = mat({ color: 0x0d0d0d, metalness: 0.8, roughness: 0.35 });
  for (const sx of [-0.74, 0.74]) for (const sz of [-0.34, 0.34]) box(0.03, 0.73, 0.03, sx, 0.365, sz, legM);

  const screenTex = TX.roomScreen();
  const lap = laptop(screenTex);
  lap.group.scale.setScalar(0.24);
  lap.group.position.set(0, 0.7755, -0.06);
  lap.pivot.rotation.x = -1.85;
  lap.edges.forEach(e => (e.visible = false));
  lap.group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(lap.group);
  lap.screenMat.color.setScalar(1.25);

  const keyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, metalness: 1, roughness: 0.24, envMapIntensity: 1.6 });
  const key = new THREE.Group();
  const bowShape = new THREE.Shape();
  bowShape.absarc(0, 0, 0.026, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(-0.008, 0, 0.009, 0, Math.PI * 2, true);
  bowShape.holes.push(hole);
  const ex = { depth: 0.004, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 3, curveSegments: 40 };
  const bow = new THREE.Mesh(new THREE.ExtrudeGeometry(bowShape, ex), keyMat);
  key.add(bow);
  const refl = new THREE.Mesh(new THREE.CircleGeometry(0.0255, 48), new THREE.MeshBasicMaterial({ map: TX.keyReflection(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, color: new THREE.Color(1.8, 1.8, 1.8) }));
  refl.position.z = 0.0058;
  key.add(refl);
  const blade = new THREE.Shape();
  blade.moveTo(0.022, -0.005); blade.lineTo(0.1, -0.005); blade.lineTo(0.106, 0); blade.lineTo(0.1, 0.006);
  [0.09, 0.078, 0.066, 0.054, 0.042].forEach((x, i) => { blade.lineTo(x + 0.004, 0.006); blade.lineTo(x, 0.006 + (i % 2 ? 0.006 : 0.009)); blade.lineTo(x - 0.006, 0.006); });
  blade.lineTo(0.022, 0.006); blade.closePath();
  const bladeM = new THREE.Mesh(new THREE.ExtrudeGeometry(blade, { ...ex, curveSegments: 4 }), keyMat);
  key.add(bladeM);
  key.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const KEY0 = V(0.36, 0.7735, 0.16);
  key.position.copy(KEY0);
  key.rotation.set(-Math.PI / 2, 0, 0.5);
  scene.add(key);

  // Motas de polvo en la luz
  const MN = 500, mr = rng(41);
  const motes = Array.from({ length: MN }, () => [-2.2 + mr() * 2.6, 0.6 + mr() * 1.8, -0.2 + mr() * 1.8, mr()]);
  const mpos = new Float32Array(MN * 3);
  const mgeo = new THREE.BufferGeometry();
  mgeo.setAttribute('position', new THREE.BufferAttribute(mpos, 3));
  const mmat = new THREE.PointsMaterial({ size: 0.006, map: TX.dot(), color: new THREE.Color(2, 1.6, 1.1), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 });
  const motesPts = new THREE.Points(mgeo, mmat);
  motesPts.frustumCulled = false;
  scene.add(motesPts);

  const point = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.glow('255,190,110'), color: hdr(0xffffff, 2.2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  scene.add(point);
  const sc = new THREE.Vector3(), sn = new THREE.Vector3(), q = new THREE.Quaternion();
  const entry = new THREE.CatmullRomCurve3([V(-7.5, 1.5, 0.7), V(-4.2, 1.4, 0.8), V(-2.5, 1.32, 0.85), V(-1.0, 1.16, 1.05), V(-0.25, 1.06, 0.95)]);

  const update = (t, cam) => {
    const F = ctx.F;
    lap.group.updateMatrixWorld(true);
    lap.screen.getWorldPosition(sc);
    lap.screen.getWorldQuaternion(q);
    sn.set(0, 0, 1).applyQuaternion(q);

    // Contenido de la pantalla según el momento
    if (t < 48) screenTex.userData.draw('ppc', prog(t, 41, 44));
    else if (t < 55) screenTex.userData.draw('guide', prog(t, 52.4, 54.8));
    else screenTex.userData.draw('tower', t);

    for (let i = 0; i < MN; i++) {
      const m = motes[i];
      mpos[i * 3] = m[0] + Math.sin(t * 0.3 + m[3] * 9) * 0.05;
      mpos[i * 3 + 1] = m[1] + ((t * 0.02 + m[3]) % 0.3);
      mpos[i * 3 + 2] = m[2] + Math.cos(t * 0.25 + m[3] * 7) * 0.05;
    }
    mgeo.attributes.position.needsUpdate = true;

    // La llave se levanta y gira: en su cara aparece el edificio
    const lift = ease.inOut(prog(t, 50.0, 51.7));
    key.position.copy(KEY0).add(V(-0.02 * lift, 0.11 * lift, 0.02 * lift));
    key.rotation.set(-Math.PI / 2 + 1.35 * lift, 0.35 * lift, 0.5 - 0.9 * lift + 0.08 * Math.sin(t * 1.4) * lift);
    refl.material.opacity = ease.inOut(prog(t, 50.6, 51.6)) * (0.75 + 0.25 * Math.sin(t * 2));

    // Revelación final: la habitación se disuelve en el vacío
    const dissolve = ease.inOut(prog(t, 55.3, 56.8));
    fadeables.forEach(m => (m.opacity = 1 - dissolve));
    skyM.opacity = 1 - dissolve;
    sun.material.opacity = 1 - dissolve;
    sunLight.intensity = 7 * (1 - dissolve);
    hemi.intensity = 0.35 * (1 - dissolve);
    shafts.forEach(s => (s.material.opacity = 0.22 * (1 - dissolve)));
    mmat.opacity = 0.6 * (1 - dissolve);
    keyMat.opacity = 1;
    key.visible = dissolve < 0.98;
    lap.metal.transparent = true;
    lap.metal.opacity = 1 - dissolve * 0.85;
    lap.screenMat.color.setScalar((1.25 - 0.9 * prog(t, 52.3, 52.8) * (1 - prog(t, 54.8, 55.1))) + 1.6 * dissolve);

    const screenCam = d => sc.clone().addScaledVector(sn, d);
    point.position.copy(sc).addScaledVector(sn, 0.01);
    if (t < 42.4) {
      const a = ease.inOut(prog(t, 38.0, 42.4));
      const p = entry.getPointAt(Math.min(a, 1));
      const tgt = V(0, 1.0, 0.3).lerp(sc, ease.inOut(prog(t, 39.6, 42.4)));
      look(cam, p, tgt, 46);
    } else if (t < 47.5) {
      const a = ease.inOut(prog(t, 42.4, 43.6));
      look(cam, V(-0.25, 1.06, 0.95).lerp(screenCam(0.5 * F), a), sc, 46);
    } else if (t < 48.4) {
      const a = ease.inOut(prog(t, 47.5, 48.4));
      look(cam, screenCam(0.5 * F).lerp(V(-0.05, 0.86, 0.32), a), sc.clone().lerp(V(0.05, 0.775, 0.02), a), 46);
    } else if (t < 52.0) {
      const a = ease.inOut(prog(t, 48.4, 49.3));
      const orbit = 0.4 + (t - 48.4) * 0.12;
      const kp = key.position;
      const p = V(kp.x + 0.03 + Math.sin(orbit) * 0.3 * F, kp.y + 0.08 + 0.03 * lift, kp.z + Math.cos(orbit) * 0.3 * F);
      look(cam, V(-0.05, 0.86, 0.32).lerp(p, a), V(0.05, 0.775, 0.02).lerp(kp, a), 40);
    } else if (t < 55.0) {
      const a = ease.inOut(prog(t, 52.0, 52.9));
      const kp = key.position;
      const orbit = 0.4 + (52 - 48.4) * 0.12;
      const p0 = V(kp.x + 0.03 + Math.sin(orbit) * 0.3 * F, kp.y + 0.11, kp.z + Math.cos(orbit) * 0.3 * F);
      look(cam, p0.lerp(screenCam(0.55 * F), a), kp.clone().lerp(sc, a), 46);
    } else {
      const a = ease.inOut(prog(t, 55.0, 57.6));
      const k = Math.pow(a, 2.2);
      const far = V(0, 4, 75);
      look(cam, screenCam(0.55 * F).lerp(far, k), sc.clone().lerp(V(0, 1.0, -0.06), a), 46);
    }
    point.material.opacity = dissolve;
    point.scale.setScalar(Math.max(0.05, cam.position.distanceTo(sc) * 0.035));
    return { bloom: 0.55 + 1.4 * dissolve, threshold: 0.85 - 0.25 * dissolve, fade: t >= 57.6 ? 1 : 1 - prog(t, 38.0, 38.5), grain: 0.05, warm: 1 - dissolve };
  };
  return { scene, update };
}
