// EmberAnvil 3D Arena - özgün düşük-poli karakterler (harici asset yok)
import * as THREE from "three";

const canvas = document.getElementById("arena");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x171208);
scene.fog = new THREE.Fog(0x171208, 8, 22);

const camera = new THREE.PerspectiveCamera(50, 640 / 300, 0.1, 100);
camera.position.set(0, 3.2, 7.5);
camera.lookAt(0, 1.2, 0);

scene.add(new THREE.HemisphereLight(0xffe0b0, 0x201409, 1.1));
const sun = new THREE.DirectionalLight(0xffc873, 1.4);
sun.position.set(4, 7, 5);
scene.add(sun);
const rim = new THREE.PointLight(0xff5a2e, 12, 12);
rim.position.set(0, 1.5, -2.5);
scene.add(rim);

// zemin + örs (dekor)
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(6, 40),
  new THREE.MeshStandardMaterial({ color: 0x2a2114, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const anvil = new THREE.Group();
const anvilBase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), new THREE.MeshStandardMaterial({ color: 0x4a4a55, roughness: 0.6, metalness: 0.7 }));
anvilBase.position.y = 0.25;
const anvilTop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 0.6), new THREE.MeshStandardMaterial({ color: 0x777788, roughness: 0.35, metalness: 0.85 }));
anvilTop.position.y = 0.65;
anvil.add(anvilBase, anvilTop);
anvil.position.set(0, 0, -2.6);
scene.add(anvil);

// çekiç (dövmede vurur)
const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), new THREE.MeshStandardMaterial({ color: 0x8a5a2e }));
const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0x9999aa, metalness: 0.8, roughness: 0.4 }));
hammerHead.position.y = 0.6;
const hammerG = new THREE.Group();
hammerG.add(hammer, hammerHead);
hammerG.position.set(0.4, 1.6, -2.6);
hammerG.rotation.z = -0.5;
scene.add(hammerG);
let smash = 0;
window.addEventListener("ember-smash", () => { smash = 1; });

// kıvılcım parçacıkları
const sparkGeo = new THREE.BufferGeometry();
const sparkN = 60;
const sparkPos = new Float32Array(sparkN * 3);
sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffb347, size: 0.08 }));
scene.add(sparks);
const sparkVel = [];
function burst(x, y, z) {
  for (let i = 0; i < sparkN; i++) {
    sparkPos[i * 3] = x; sparkPos[i * 3 + 1] = y; sparkPos[i * 3 + 2] = z;
    sparkVel[i] = [(Math.random() - 0.5) * 4, Math.random() * 4, (Math.random() - 0.5) * 4];
  }
}

// özgün karakter üretici (kutulardan kurulu, telifsiz)
function makeFighter(bodyColor, trimColor) {
  const g = new THREE.Group();
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.35), mat(0x2c2318));
  legs.position.y = 0.3;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.5), mat(bodyColor));
  body.position.y = 1.05;
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.15, 0.54), mat(trimColor));
  belt.position.y = 0.75;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat(0xe8b88a));
  head.position.y = 1.8;
  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.2, 0.56), mat(trimColor));
  helm.position.y = 2.0;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.8, 0.22), mat(bodyColor));
  armL.position.set(-0.55, 1.05, 0);
  const armR = armL.clone();
  armR.position.x = 0.55;
  const sword = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), new THREE.MeshStandardMaterial({ color: 0xcfd6e4, metalness: 0.9, roughness: 0.25 }));
  sword.position.set(0.62, 1.0, 0.3);
  sword.rotation.x = 0.5;
  g.add(legs, body, belt, head, helm, armL, armR, sword);
  g.userData = { armR, sword, head };
  return g;
}

const player = makeFighter(0x3e6b4f, 0xe8b34b);
player.position.set(-1.8, 0, 0.4);
player.rotation.y = 0.5;
scene.add(player);

let enemy = makeFighter(0x6b3e3e, 0x7a2e2e);
enemy.position.set(1.8, 0, 0.4);
enemy.rotation.y = -0.5;
scene.add(enemy);

// savaş durumu
let foeLevel = 1;
let hpP = 100, hpPMax = 100, hpE = 60, hpEMax = 60;
let lungeP = 0, lungeE = 0, hurtE = 0, hurtP = 0;
let cooldown = 0;

function stats() { return window.GAME?.stats ?? { atk: 10, level: 1, age: 0, auto: true }; }
function newFoe() {
  const st = stats();
  foeLevel = Math.max(1, st.level + Math.floor(Math.random() * 2 - 0.5) + st.age);
  hpEMax = hpE = 40 + foeLevel * 22 + st.age * 15;
  const hue = [0x6b3e3e, 0x4f3e6b, 0x3e5a6b, 0x5a6b3e][st.age % 4];
  scene.remove(enemy);
  enemy = makeFighter(hue, 0x222222);
  enemy.position.set(1.8, 0, 0.4);
  enemy.rotation.y = -0.5;
  scene.add(enemy);
  log(`Yeni rakip geldi! (Lv ${foeLevel})`);
}
function log(m) { const el = document.getElementById("battle-log"); if (el) el.textContent = m; }
function dmgNum(text, x) {
  const el = document.getElementById("battle-log");
  if (el) el.textContent = `${text}  —  ${el.textContent}`.slice(0, 140);
}

function playerAttack() {
  if (hpE <= 0 || hpP <= 0) return;
  const st = stats();
  const dmg = Math.floor(st.atk * (0.85 + Math.random() * 0.3));
  hpE -= dmg; lungeP = 1; hurtE = 1; burst(1.8, 1.3, 0.4);
  dmgNum(`Vurdun -${dmg}`);
  if (hpE <= 0) {
    const gold = Math.floor((20 + foeLevel * 14) * (1 + st.age * 0.5));
    const xp = 8 + foeLevel * 3;
    window.GAME?.onWin({ gold, xp });
    log(`Kazandın! +${gold} altın, +${xp} XP (Galibiyet arenası)`);
    setTimeout(newFoe, 900);
  }
}
function enemyAttack() {
  if (hpE <= 0 || hpP <= 0) return;
  const st = stats();
  const dmg = Math.floor((4 + foeLevel * 3) * (0.8 + Math.random() * 0.4));
  hpP -= dmg; lungeE = 1; hurtP = 1;
  if (hpP <= 0) { hpP = 0; log("Yenildin! 3 sn sonra toparlanıyorsun..."); setTimeout(() => { hpPMax = 100 + st.level * 10; hpP = hpPMax; log("Tekrar dövüştesin!"); }, 3000); }
}

window.addEventListener("ember-attack", playerAttack);
window.addEventListener("ember-next-foe", newFoe);

function hp() {
  const st = stats();
  hpPMax = 100 + st.level * 10;
  document.getElementById("hp-player").style.width = `${Math.max(0, hpP / hpPMax) * 100}%`;
  document.getElementById("hp-enemy").style.width = `${Math.max(0, hpE / hpEMax) * 100}%`;
  document.getElementById("hp-player-t").textContent = `${Math.max(0, Math.floor(hpP))}/${hpPMax}`;
  document.getElementById("hp-enemy-t").textContent = `${Math.max(0, Math.floor(hpE))}/${hpEMax} (Lv ${foeLevel})`;
}

const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const t = clock.getElapsedTime();
  const st = stats();

  // idle animasyonu: nefes alma
  player.position.y = Math.abs(Math.sin(t * 2)) * 0.05;
  enemy.position.y = Math.abs(Math.cos(t * 2.2)) * 0.05;
  player.userData.armR.rotation.x = Math.sin(t * 2) * 0.15;
  enemy.userData.armR.rotation.x = Math.cos(t * 2.2) * 0.15;

  // hamle animasyonu
  if (lungeP > 0) { lungeP -= 0.06; player.position.x = -1.8 + (1 - lungeP) * 0.9 * Math.sin(lungeP * Math.PI); }
  else player.position.x = -1.8;
  if (lungeE > 0) { lungeE -= 0.06; enemy.position.x = 1.8 - (1 - lungeE) * 0.9 * Math.sin(lungeE * Math.PI); }
  else enemy.position.x = 1.8;
  if (hurtE > 0) { hurtE -= 0.08; enemy.rotation.z = hurtE * 0.25; } else enemy.rotation.z = 0;
  if (hurtP > 0) { hurtP -= 0.08; player.rotation.z = -hurtP * 0.25; } else player.rotation.z = 0;

  // çekiç vuruşu
  if (smash > 0) {
    smash -= 0.07;
    hammerG.rotation.z = -0.5 - Math.sin((1 - smash) * Math.PI) * 1.1;
    if (smash <= 0.5 && smash > 0.4) burst(0, 0.9, -2.6);
  } else hammerG.rotation.z = -0.5 + Math.sin(t * 1.2) * 0.08;

  // kıvılcımlar
  for (let i = 0; i < sparkN; i++) {
    if (!sparkVel[i]) continue;
    sparkPos[i * 3] += sparkVel[i][0] * 0.016;
    sparkPos[i * 3 + 1] += sparkVel[i][1] * 0.016;
    sparkPos[i * 3 + 2] += sparkVel[i][2] * 0.016;
    sparkVel[i][1] -= 0.12;
    if (sparkPos[i * 3 + 1] < 0) sparkVel[i] = null;
  }
  sparkGeo.attributes.position.needsUpdate = true;

  // oto-savaş
  cooldown -= 0.016;
  if (st.auto && cooldown <= 0 && hpE > 0 && hpP > 0) { playerAttack(); cooldown = 1.4; if (Math.random() < 0.6) setTimeout(enemyAttack, 350); }

  hp();
  renderer.render(scene, camera);
}
newFoe();
loop();

window.addEventListener("resize", () => {
  const w = canvas.clientWidth || 640;
  renderer.setSize(w, 300, false);
  camera.aspect = w / 300;
  camera.updateProjectionMatrix();
});
renderer.setSize(640, 300, false);
