// EmberAnvil 3D v0.3 — özgün forge + arena (tüm modeller prosedürel, harici asset yok)
import * as THREE from "three";

const ARMOR = [
  { tunic: 0x6b4f35, trim: 0x8a6b45, helm: 0x4a3a28, cape: null },        // Kürk Yelek
  { tunic: 0x5a5f6b, trim: 0xe8b34b, helm: 0x8b8f9b, cape: 0x7a2020 },     // Zincir Zırh
  { tunic: 0x2e4a5a, trim: 0x9fd8ff, helm: 0x3a4a5c, cape: 0x1e2e3e },     // Kompozit Yelek
  { tunic: 0x1e2e4a, trim: 0x66ffee, helm: 0x2e3e5c, cape: 0x0e1e3e },     // Nano Zırh
  { tunic: 0x2a1e4a, trim: 0xcc88ff, helm: 0x3e2e5c, cape: 0x4a2e7a },     // Kuantum Pelerin
];
const FOES = [
  { name: "Kaya Golemi",   body: 0x6b6b66, trim: 0x4a5a3a, scale: 1.25 },
  { name: "Kara Şövalye",  body: 0x2e2e36, trim: 0x8b2020, scale: 1.0 },
  { name: "Hurda Drone",   body: 0x5a6b3e, trim: 0xd8e84b, scale: 0.9, float: true },
  { name: "Void Akıncısı", body: 0x1e1e3e, trim: 0x8833ff, scale: 1.05, float: true },
  { name: "Entropi Lordu", body: 0x3e1e2e, trim: 0xff3388, scale: 1.4 },
];
const WEAPON_STYLE = {
  "tas-balta": "axe", "kemik-mizrak": "spear", "demir-kilic": "sword",
  "sovalye-teberi": "axe2", "celik-pala": "sword2", "titanyum-cekic": "hammer",
  "plazma-baltasi": "axeGlow", "nolcek-kamasi": "dagger", "kuantum-kilic": "swordGlow",
  "tekillik-orsu": "mace",
};

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.15, ...o });

// --- insan modeli: kıyafet + zırh + kask + pelerin (orijinal, prosedürel) ---
function makeHumanoid(opt = {}) {
  const { skin = 0xe8b88a, tunic = 0x3e6b4f, trim = 0xe8b34b, helm = null, cape = null } = opt;
  const g = new THREE.Group();
  const parts = {};
  const legG = new THREE.CapsuleGeometry(0.11, 0.4, 4, 10);
  parts.legL = new THREE.Mesh(legG, mat(0x2c2318)); parts.legL.position.set(-0.16, 0.35, 0);
  parts.legR = parts.legL.clone(); parts.legR.position.x = 0.16;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.55, 6, 14), mat(tunic));
  torso.position.y = 1.0;
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.12, 14), mat(trim, { metalness: 0.6, roughness: 0.4 }));
  belt.position.y = 0.78;
  // omuzluklar
  const padG = new THREE.SphereGeometry(0.16, 12, 10);
  const padL = new THREE.Mesh(padG, mat(trim, { metalness: 0.5, roughness: 0.45 })); padL.position.set(-0.42, 1.38, 0);
  const padR = padL.clone(); padR.position.x = 0.42;
  // kollar (pivot omuzda)
  function arm(side) {
    const p = new THREE.Group(); p.position.set(0.42 * side, 1.32, 0);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.45, 4, 10), mat(tunic));
    m.position.y = -0.3; p.add(m);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat(skin));
    hand.position.y = -0.6; p.add(hand);
    return p;
  }
  parts.armL = arm(-1); parts.armR = arm(1);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat(skin));
  head.position.y = 1.72;
  parts.head = head;
  g.add(parts.legL, parts.legR, torso, belt, padL, padR, parts.armL, parts.armR, head);
  if (helm) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.22, 14), mat(helm, { metalness: 0.65, roughness: 0.35 }));
    h.position.y = 1.9; g.add(h);
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.4), mat(trim));
    crest.position.y = 2.05; g.add(crest);
  }
  if (cape) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), new THREE.MeshStandardMaterial({ color: cape, roughness: 0.9, side: THREE.DoubleSide }));
    c.position.set(0, 1.05, -0.3); c.rotation.x = 0.15; g.add(c); parts.cape = c;
  }
  g.userData.parts = parts;
  return g;
}

// --- silah modelleri (orijinal, prosedürel) ---
function makeWeapon(id) {
  const style = WEAPON_STYLE[id] || "sword";
  const g = new THREE.Group();
  const steel = mat(0xcfd6e4, { metalness: 0.9, roughness: 0.25 });
  const dark = mat(0x3a2e1e, { roughness: 0.9 });
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 8), dark);
  grip.position.y = 0.1; g.add(grip);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.1), mat(0x8a6b2e, { metalness: 0.7, roughness: 0.4 }));
  guard.position.y = 0.36; g.add(guard);
  const glow = style.includes("Glow");
  const bladeMat = glow ? new THREE.MeshStandardMaterial({ color: 0x66ffee, emissive: 0x22ffcc, emissiveIntensity: 1.2 }) : steel;
  if (style === "axe" || style === "axe2" || style === "axeGlow") {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), dark);
    shaft.position.y = 0.6; g.add(shaft);
    const headM = style === "axeGlow"
      ? new THREE.MeshStandardMaterial({ color: 0x66ffee, emissive: 0x22ffcc, emissiveIntensity: 1.0, metalness: 0.4, roughness: 0.3 })
      : mat(style === "axe2" ? 0x9aa2b5 : 0x6b6b66, { metalness: 0.7, roughness: 0.4 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.08), headM);
    head.position.set(0.2, 1.05, 0); g.add(head);
  } else if (style === "spear") {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), dark);
    shaft.position.y = 0.7; g.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), mat(0xd8d0c0, { metalness: 0.6 }));
    tip.position.y = 1.55; g.add(tip);
  } else if (style === "hammer" || style === "mace") {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), dark);
    shaft.position.y = 0.55; g.add(shaft);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.28), glow ? bladeMat : mat(0x8b8f9b, { metalness: 0.8, roughness: 0.3 }));
    head.position.y = 1.05; g.add(head);
  } else {
    const len = style === "dagger" ? 0.55 : style === "sword2" ? 1.0 : style === "swordGlow" ? 1.1 : 0.9;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.13, len, 0.05), bladeMat);
    blade.position.y = 0.4 + len / 2; g.add(blade);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 4), bladeMat);
    tip.position.y = 0.4 + len + 0.1; tip.rotation.y = Math.PI / 4; g.add(tip);
  }
  return g;
}

function attachWeapon(char, id) {
  const p = char.userData.parts;
  if (p.weapon) { p.armR.remove(p.weapon); }
  if (!id) { p.weapon = null; return; }
  const w = makeWeapon(id);
  w.position.set(0, -0.6, 0.15); w.rotation.x = -0.4;
  p.armR.add(w); p.weapon = w;
}

// --- mini sahne iskeleti ---
function baseScene(bg) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 10, 26);
  scene.add(new THREE.HemisphereLight(0xffe6c0, 0x241a10, 0.9));
  const sun = new THREE.DirectionalLight(0xffd9a0, 1.6);
  sun.position.set(5, 8, 4); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  return scene;
}
function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true });
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  return r;
}
// sürükle-döndür kamera
function orbitCam(cam, canvas, tx = 0, ty = 1.2) {
  let yaw = 0, pitch = 0.32, dist = 7.5, down = false, lx = 0;
  canvas.addEventListener("pointerdown", (e) => { down = true; lx = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => { if (down) { yaw -= (e.clientX - lx) * 0.008; lx = e.clientX; } });
  canvas.addEventListener("pointerup", () => (down = false));
  canvas.addEventListener("wheel", (e) => { dist = Math.min(12, Math.max(4.5, dist + e.deltaY * 0.005)); e.preventDefault(); }, { passive: false });
  return { update() {
    cam.position.set(tx + Math.sin(yaw) * Math.cos(pitch) * dist, ty + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist);
    cam.lookAt(tx, ty, 0);
  } };
}
// hasar yazısı (HTML overlay)
function floatText(layer, canvas, cam, pos, text, cls) {
  const v = pos.clone().project(cam);
  const r = canvas.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "dmg " + cls;
  el.textContent = text;
  el.style.left = `${((v.x + 1) / 2) * r.width}px`;
  el.style.top = `${((1 - v.y) / 2) * r.height}px`;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}
const stats = () => window.GAME?.stats ?? { atk: 10, level: 1, age: 0, auto: true, equipped: null, owned: [] };

// ================= DEMİRHANE =================
const fc = document.getElementById("scene-forge");
const forgeRenderer = makeRenderer(fc);
const fs = baseScene(0x140f08);
const fcam = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100);
const fOrbit = orbitCam(fcam, fc, 0, 1.3);

const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat(0x3a2c1c, { roughness: 1 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; fs.add(floor);
// duvar + kirişler
for (let i = -1; i <= 1; i++) {
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5, 0.35), mat(0x2c1e12));
  beam.position.set(i * 4, 2.5, -4); fs.add(beam);
}
// ocak (fırın)
const furnace = new THREE.Group();
const fbody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 1.6), mat(0x4a3a2c));
fbody.position.y = 1.1; fbody.castShadow = true;
const mouth = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8),
  new THREE.MeshStandardMaterial({ color: 0xff7722, emissive: 0xff5500, emissiveIntensity: 2.2 }));
mouth.position.set(0, 0.8, 0.81);
furnace.add(fbody, mouth);
furnace.position.set(-2.6, 0, -2.5);
fs.add(furnace);
const fireLight = new THREE.PointLight(0xff6622, 30, 9);
fireLight.position.set(-2.6, 1.2, -1.4); fs.add(fireLight);
// ateş parçacıkları
const fireN = 50, firePos = new Float32Array(fireN * 3), fireVel = [];
const fireGeo = new THREE.BufferGeometry();
for (let i = 0; i < fireN; i++) {
  firePos.set([-2.6 + (Math.random() - 0.5), 0.8 + Math.random() * 0.5, -1.6], i * 3);
  fireVel.push(Math.random() * 1.5 + 0.8);
}
fireGeo.setAttribute("position", new THREE.BufferAttribute(firePos, 3));
fs.add(new THREE.Points(fireGeo, new THREE.PointsMaterial({ color: 0xffa030, size: 0.09, transparent: true, opacity: 0.9 })));
// örs
const anvil = new THREE.Group();
const ab = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), mat(0x3a3a44, { metalness: 0.6, roughness: 0.5 }));
ab.position.y = 0.3; ab.castShadow = true;
const at = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 0.65), mat(0x8b8f9f, { metalness: 0.85, roughness: 0.3 }));
at.position.y = 0.75; at.castShadow = true;
anvil.add(ab, at); anvil.position.set(0.4, 0, -0.6); fs.add(anvil);
// sıcak metal (dövülürken parlar)
const hotMetal = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.18),
  new THREE.MeshStandardMaterial({ color: 0xff8830, emissive: 0xff5500, emissiveIntensity: 1.5 }));
hotMetal.position.set(0.4, 0.98, -0.6); fs.add(hotMetal);
// demirci
const smith = makeHumanoid({ tunic: 0x4a3626, trim: 0xe8b34b, helm: null });
smith.position.set(0.4, 0, 0.7); smith.rotation.y = Math.PI; smith.traverse((o) => (o.castShadow = true));
fs.add(smith);
const smithHammer = new THREE.Group();
const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), mat(0x5a4028));
const shHead = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.22), mat(0x9aa2b5, { metalness: 0.8, roughness: 0.3 }));
shHead.position.y = 0.5; smithHammer.add(sh, shHead);
smithHammer.position.set(0, -0.6, 0.1);
smith.userData.parts.armR.add(smithHammer);
// silah rafı (sahip olunanlar)
const rack = new THREE.Group();
const rail = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.12), mat(0x5a4028));
rail.position.y = 1.7; rack.add(rail);
rack.position.set(2.6, 0, -2.8); rack.rotation.y = -0.4;
fs.add(rack);
function refreshRack() {
  [...rack.children].forEach((c) => { if (c !== rail) rack.remove(c); });
  stats().owned.slice(0, 6).forEach((id, i) => {
    const w = makeWeapon(id);
    w.position.set(-1.3 + i * 0.55, 1.05, 0); w.rotation.z = 0.15;
    rack.add(w);
  });
}
window.addEventListener("ember-stats", refreshRack);
window.addEventListener("ember-craft", refreshRack);
window.addEventListener("ember-equip", refreshRack);
// kıvılcım
const spN = 70, spPos = new Float32Array(spN * 3), spVel = new Array(spN).fill(null);
const spGeo = new THREE.BufferGeometry();
spGeo.setAttribute("position", new THREE.BufferAttribute(spPos, 3));
fs.add(new THREE.Points(spGeo, new THREE.PointsMaterial({ color: 0xffc060, size: 0.07 })));
function burst(p, x, y, z, n = 20, spread = 3) {
  let c = 0;
  for (let i = 0; i < spN && c < n; i++) {
    if (spVel[i]) continue;
    spPos.set([x, y, z], i * 3);
    spVel[i] = [(Math.random() - 0.5) * spread, Math.random() * spread, (Math.random() - 0.5) * spread];
    c++;
  }
}
let smash = 0;
window.addEventListener("ember-smash", () => { smash = 1; });

// ================= ARENA =================
const ac = document.getElementById("scene-arena");
const arenaRenderer = makeRenderer(ac);
const as = baseScene(0x0e1420);
const acam = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100);
const aOrbit = orbitCam(acam, ac, 0, 1.3);
const sand = new THREE.Mesh(new THREE.CircleGeometry(6.5, 44), mat(0x4a4030, { roughness: 1 }));
sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; as.add(sand);
const ring = new THREE.Mesh(new THREE.RingGeometry(5.2, 5.5, 44), mat(0xe8b34b, { metalness: 0.5, roughness: 0.5 }));
ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; as.add(ring);
// meşaleler
[[-4.5, -3], [4.5, -3]].forEach(([x, z]) => {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 8), mat(0x3a2a18));
  pole.position.set(x, 1.1, z); as.add(pole);
  const fl = new THREE.PointLight(0xff8830, 20, 8);
  fl.position.set(x, 2.4, z); as.add(fl);
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xffaa30, emissive: 0xff6600, emissiveIntensity: 2.5 }));
  f.position.set(x, 2.35, z); as.add(f);
});

const player = makeHumanoid({ tunic: 0x3e6b4f, trim: 0xe8b34b, helm: 0x8b8f9b, cape: 0x7a2020 });
player.position.set(-2, 0, 0.5); player.rotation.y = 0.6;
player.traverse((o) => (o.castShadow = true)); as.add(player);
let enemy = null;
function spawnEnemy(age, scalef = 1) {
  if (enemy) as.remove(enemy);
  const f = FOES[age % FOES.length];
  enemy = makeHumanoid({
    skin: 0x9a9a8a, tunic: f.body, trim: f.trim,
    helm: 0x222228, cape: age >= 3 ? 0x1a0a2a : null,
  });
  enemy.scale.setScalar((f.scale || 1) * scalef);
  enemy.position.set(2, f.float ? 0.5 : 0, 0.5);
  enemy.rotation.y = -0.6;
  enemy.traverse((o) => (o.castShadow = true));
  enemy.userData.float = !!f.float;
  as.add(enemy);
  document.getElementById("foe-name").textContent = `${f.name} (Lv ${foeLevel})`;
}
function dressPlayer() {
  const st = stats();
  const a = ARMOR[st.age % ARMOR.length];
  const np = makeHumanoid({ tunic: a.tunic, trim: a.trim, helm: a.helm, cape: a.cape });
  np.position.copy(player.position); np.rotation.copy(player.rotation);
  as.remove(player);
  player.clear();
  // parça transferi yerine yeniden kur (basit ve sağlam)
  np.traverse((o) => (o.castShadow = true));
  player.add(...np.children);
  player.userData.parts = np.userData.parts;
  attachWeapon(player, st.equipped);
}
window.addEventListener("ember-stats", dressPlayer);
window.addEventListener("ember-craft", (e) => attachWeapon(player, e.detail));
window.addEventListener("ember-equip", (e) => attachWeapon(player, e.detail));

// savaş durumu
let foeLevel = 1, hpP = 100, hpPMax = 100, hpE = 60, hpEMax = 60;
let lungeP = 0, lungeE = 0, hurtP = 0, hurtE = 0, deadE = 0, cool = 0;
function newFoe() {
  const st = stats();
  foeLevel = Math.max(1, st.level + st.age * 2 + Math.floor(Math.random() * 3 - 1));
  hpEMax = hpE = 45 + foeLevel * 24 + st.age * 20;
  deadE = 0;
  spawnEnemy(st.age);
  log(`${document.getElementById("foe-name").textContent} arenaya girdi!`);
}
function log(m) { const el = document.getElementById("battle-log"); if (el) el.textContent = m; }
function playerAttack() {
  if (hpE <= 0 || hpP <= 0 || deadE) return;
  const st = stats();
  const dmg = Math.floor(st.atk * (0.85 + Math.random() * 0.3));
  hpE -= dmg; lungeP = 1; hurtE = 1;
  burst(spPos, 0, 0, 0); // (forge sahnesi havuzu; arena için aşağıda ayrı)
  asparks(2, 1.3, 0.5);
  floatText(document.getElementById("arena-fx"), ac, acam, new THREE.Vector3(2, 2.2, 0.5), `-${dmg}`, "hit");
  if (hpE <= 0) {
    hpE = 0; deadE = 1;
    const gold = Math.floor((20 + foeLevel * 14) * (1 + st.age * 0.5));
    const xp = 8 + foeLevel * 3;
    window.GAME?.onWin({ gold, xp });
    log(`Kazandın! +${gold} altın, +${xp} XP`);
    floatText(document.getElementById("arena-fx"), ac, acam, new THREE.Vector3(0, 2.5, 0), `+${gold} altın`, "win");
    setTimeout(newFoe, 1400);
  }
}
function enemyAttack() {
  if (hpE <= 0 || hpP <= 0 || deadE) return;
  const dmg = Math.floor((4 + foeLevel * 3) * (0.8 + Math.random() * 0.4));
  hpP -= dmg; lungeE = 1; hurtP = 1;
  floatText(document.getElementById("arena-fx"), ac, acam, new THREE.Vector3(-2, 2.2, 0.5), `-${dmg}`, "hurt");
  if (hpP <= 0) { hpP = 0; log("Yenildin! Toparlanıyorsun..."); setTimeout(() => { const st = stats(); hpPMax = 100 + st.level * 10; hpP = hpPMax; log("Tekrar dövüştesin!"); }, 3000); }
}
window.addEventListener("ember-attack", playerAttack);
window.addEventListener("ember-next-foe", newFoe);
// arena kıvılcımları
const aN = 60, aPos = new Float32Array(aN * 3), aVel = new Array(aN).fill(null);
const aGeo = new THREE.BufferGeometry();
aGeo.setAttribute("position", new THREE.BufferAttribute(aPos, 3));
as.add(new THREE.Points(aGeo, new THREE.PointsMaterial({ color: 0xffd060, size: 0.08 })));
function asparks(x, y, z) {
  let c = 0;
  for (let i = 0; i < aN && c < 18; i++) {
    if (aVel[i]) continue;
    aPos.set([x, y, z], i * 3);
    aVel[i] = [(Math.random() - 0.5) * 4, Math.random() * 4, (Math.random() - 0.5) * 4];
    c++;
  }
}
function hp() {
  const st = stats();
  hpPMax = 100 + st.level * 10;
  document.getElementById("hp-player").style.width = `${(Math.max(0, hpP) / hpPMax) * 100}%`;
  document.getElementById("hp-enemy").style.width = `${(Math.max(0, hpE) / hpEMax) * 100}%`;
  document.getElementById("hp-player-t").textContent = `${Math.max(0, Math.floor(hpP))}/${hpPMax}`;
  document.getElementById("hp-enemy-t").textContent = `${Math.max(0, Math.floor(hpE))}/${hpEMax}`;
}

// --- ana döngü ---
const clock = new THREE.Clock();
function sizeCanvas(renderer, canvas) {
  const w = canvas.clientWidth || 640, h = 300;
  if (canvas.width !== w * devicePixelRatio) renderer.setSize(w, h, false);
  return w / h;
}
dressPlayer(); spawnEnemy(0); refreshRack(); newFoe();
let fireT = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const st = stats();
  const forgeOpen = !document.getElementById("forge-view").hidden && !document.getElementById("tab-view").hidden;

  if (forgeOpen) {
    // demirci çekiç animasyonu
    const P = smith.userData.parts;
    if (smash > 0) {
      smash -= dt * 2.2;
      P.armR.rotation.x = -2.2 + Math.sin((1 - Math.max(0, smash)) * Math.PI) * 1.4;
      if (smash < 0.55 && smash > 0.45) { burst(spPos, 0.4, 1.1, -0.6); }
      if (smash <= 0) { P.armR.rotation.x = -0.4; hotMetal.material.emissiveIntensity = 1.5; }
    } else {
      P.armR.rotation.x = -0.4 + Math.sin(t * 3) * 0.5;
      P.armL.rotation.x = Math.sin(t * 3) * 0.2;
    }
    smith.position.y = Math.abs(Math.sin(t * 3)) * 0.02;
    if (P.cape) P.cape.rotation.x = 0.15 + Math.sin(t * 2) * 0.05;
    hotMetal.material.emissiveIntensity = 1.2 + Math.sin(t * 5) * 0.3 + (smash > 0 ? 1 : 0);
    fireLight.intensity = 26 + Math.sin(t * 9) * 5 + Math.random() * 2;
    // ateş yükselir
    for (let i = 0; i < fireN; i++) {
      firePos[i * 3 + 1] += fireVel[i] * dt;
      firePos[i * 3] += Math.sin(t * 3 + i) * 0.003;
      if (firePos[i * 3 + 1] > 2.1) { firePos[i * 3 + 1] = 0.8; firePos[i * 3] = -2.6 + (Math.random() - 0.5); }
    }
    fireGeo.attributes.position.needsUpdate = true;
    for (let i = 0; i < spN; i++) {
      if (!spVel[i]) continue;
      spPos[i * 3] += spVel[i][0] * dt; spPos[i * 3 + 1] += spVel[i][1] * dt; spPos[i * 3 + 2] += spVel[i][2] * dt;
      spVel[i][1] -= 9 * dt;
      if (spPos[i * 3 + 1] < 0) spVel[i] = null;
    }
    spGeo.attributes.position.needsUpdate = true;
    fcam.aspect = sizeCanvas(forgeRenderer, fc); fcam.updateProjectionMatrix();
    fOrbit.update(); forgeRenderer.render(fs, fcam);
  } else if (!document.getElementById("arena-view").hidden) {
    // arena animasyonu
    const PP = player.userData.parts;
    PP.legL.rotation.x = Math.sin(t * 4) * 0.25; PP.legR.rotation.x = -Math.sin(t * 4) * 0.25;
    PP.armL.rotation.x = Math.sin(t * 4) * 0.2;
    if (PP.cape) PP.cape.rotation.x = 0.15 + Math.sin(t * 3) * 0.08;
    if (enemy) {
      const EP = enemy.userData.parts;
      if (enemy.userData.float) enemy.position.y = 0.5 + Math.sin(t * 2.5) * 0.12;
      else { EP.legL.rotation.x = Math.cos(t * 3.4) * 0.25; EP.legR.rotation.x = -Math.cos(t * 3.4) * 0.25; }
      if (lungeE > 0) { lungeE -= dt * 2.4; enemy.position.x = 2 - Math.sin(Math.max(0, lungeE) * Math.PI) * 1.1; }
      if (hurtE > 0) { hurtE -= dt * 3; enemy.rotation.z = hurtE * 0.3; } else if (!deadE) enemy.rotation.z = 0;
      if (deadE) { enemy.rotation.x = Math.min(Math.PI / 2, enemy.rotation.x + dt * 4); enemy.position.y = Math.max(0.1, enemy.position.y - dt); }
      else enemy.rotation.x = 0;
    }
    if (lungeP > 0) { lungeP -= dt * 2.4; player.position.x = -2 + Math.sin(Math.max(0, lungeP) * Math.PI) * 1.1; PP.armR.rotation.x = -1.8; }
    else { player.position.x = -2; PP.armR.rotation.x = Math.sin(t * 4) * 0.2; }
    if (hurtP > 0) { hurtP -= dt * 3; player.rotation.z = -hurtP * 0.3; } else player.rotation.z = 0;
    for (let i = 0; i < aN; i++) {
      if (!aVel[i]) continue;
      aPos[i * 3] += aVel[i][0] * dt; aPos[i * 3 + 1] += aVel[i][1] * dt; aPos[i * 3 + 2] += aVel[i][2] * dt;
      aVel[i][1] -= 9 * dt;
      if (aPos[i * 3 + 1] < 0) aVel[i] = null;
    }
    aGeo.attributes.position.needsUpdate = true;
    cool -= dt; fireT += dt;
    if (st.auto && cool <= 0 && hpE > 0 && hpP > 0 && !deadE) {
      playerAttack(); cool = 1.5;
      if (hpE > 0 && Math.random() < 0.65) setTimeout(enemyAttack, 400);
    }
    hp();
    acam.aspect = sizeCanvas(arenaRenderer, ac); acam.updateProjectionMatrix();
    aOrbit.update(); arenaRenderer.render(as, acam);
  }
}
loop();
