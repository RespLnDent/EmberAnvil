// ForgeMaster Web v0.1 - basit idle demirci prototipi
const AGES = [
  { name: "Taş Devri", mult: 1, cost: 0, gear: "Taş Balta" },
  { name: "Orta Çağ", mult: 2, cost: 500, gear: "Demir Kılıç" },
  { name: "Modern Çağ", mult: 4, cost: 2500, gear: "Çelik Tüfek" },
  { name: "Uzay Çağı", mult: 8, cost: 12000, gear: "Plazma Kılıcı" },
  { name: "Kuantum Çağı", mult: 16, cost: 60000, gear: "Kuantum Zırhı" },
];
const SAVE_KEY = "forgemaster-web-v1";

const def = () => ({
  gold: 0, ore: 0, ingot: 0,
  level: 1, xp: 0,
  pickLv: 1, forgeLv: 1, bellowsLv: 0,
  ageIndex: 0,
  totalForged: 0,
  lastSeen: Date.now(),
});

let s = def();

function xpNeed() { return 20 * s.level; }
function mineAmount() { return s.pickLv; }
function forgeCost() { return 2; }
function forgeGold() { return (10 + s.forgeLv * 8) * AGES[s.ageIndex].mult; }
function perSec() { return s.bellowsLv * (2 + s.ageIndex * 2); }
function pickCost() { return Math.floor(25 * Math.pow(1.6, s.pickLv - 1)); }
function forgeUpCost() { return Math.floor(50 * Math.pow(1.7, s.forgeLv - 1)); }
function bellowsCost() { return Math.floor(40 * Math.pow(1.65, s.bellowsLv)); }
function ageCost() {
  if (s.ageIndex + 1 >= AGES.length) return null;
  return AGES[s.ageIndex + 1].cost;
}

function save(silent) {
  s.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  if (!silent) flash("Kaydedildi ✔");
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    s = Object.assign(def(), d);
    // çevrimdışı kazanç
    const dt = Math.min(Date.now() - (s.lastSeen || Date.now()), 8 * 3600 * 1000) / 1000;
    const gain = Math.floor(perSec() * dt);
    if (gain > 0) {
      s.gold += gain;
      document.getElementById("offline-msg").textContent =
        `Çevrimdışıyken +${gain} altın kazandın (${Math.floor(dt / 60)} dk).`;
    }
  } catch { /* bozuk kayıt yok say */ }
}

function gainXp(n) {
  s.xp += n;
  while (s.xp >= xpNeed()) { s.xp -= xpNeed(); s.level += 1; flash(`Seviye atladın! Lv ${s.level}`); }
}

function flash(msg) {
  const el = document.getElementById("offline-msg");
  el.textContent = msg;
  clearTimeout(flash.t);
  flash.t = setTimeout(() => { if (el.textContent === msg) el.textContent = ""; }, 2500);
}

function render() {
  const $ = (id) => document.getElementById(id);
  $("gold").textContent = Math.floor(s.gold);
  $("ore").textContent = Math.floor(s.ore);
  $("ingot").textContent = Math.floor(s.ingot);
  $("level").textContent = s.level;
  $("xp").textContent = s.xp;
  $("xp-need").textContent = xpNeed();
  $("per-sec").textContent = perSec();
  $("forge-power").textContent = forgeGold();
  $("age-name").textContent = `${AGES[s.ageIndex].name} — ${AGES[s.ageIndex].gear}`;
  $("xp-bar").style.width = `${(s.xp / xpNeed()) * 100}%`;
  $("mine-amount").textContent = mineAmount();
  $("forge-cost").textContent = forgeCost();
  $("pick-lv").textContent = s.pickLv;
  $("forge-lv").textContent = s.forgeLv;
  $("bellows-lv").textContent = s.bellowsLv;
  $("pick-cost").textContent = pickCost();
  $("forge-up-cost").textContent = forgeUpCost();
  $("bellows-cost").textContent = bellowsCost();

  const c = ageCost();
  $("age-cost").textContent = c === null ? "MAX" : c;
  $("btn-age").disabled = c === null || s.gold < c;
  $("btn-smelt").disabled = s.ore < 2;
  $("btn-forge").disabled = s.ingot < forgeCost();
  $("btn-up-pick").disabled = s.gold < pickCost();
  $("btn-up-forge").disabled = s.gold < forgeUpCost();
  $("btn-up-bellows").disabled = s.gold < bellowsCost();

  const ol = $("ages");
  ol.innerHTML = "";
  AGES.forEach((a, i) => {
    const li = document.createElement("li");
    li.textContent = `${a.name} (x${a.mult}) — ${a.gear}`;
    if (i < s.ageIndex) li.className = "done";
    if (i === s.ageIndex) li.className = "now";
    ol.appendChild(li);
  });
}

function tick() {
  s.gold += perSec() / 10;
  render();
}

window.addEventListener("DOMContentLoaded", () => {
  load();
  const $ = (id) => document.getElementById(id);
  $("btn-mine").onclick = () => { s.ore += mineAmount(); render(); };
  $("btn-smelt").onclick = () => {
    if (s.ore < 2) return;
    s.ore -= 2; s.ingot += 1; gainXp(2); render();
  };
  $("btn-forge").onclick = () => {
    if (s.ingot < forgeCost()) return;
    s.ingot -= forgeCost();
    const g = forgeGold();
    s.gold += g; s.totalForged += 1; gainXp(6); render();
  };
  $("btn-up-pick").onclick = () => { if (s.gold < pickCost()) return; s.gold -= pickCost(); s.pickLv += 1; render(); };
  $("btn-up-forge").onclick = () => { if (s.gold < forgeUpCost()) return; s.gold -= forgeUpCost(); s.forgeLv += 1; render(); };
  $("btn-up-bellows").onclick = () => { if (s.gold < bellowsCost()) return; s.gold -= bellowsCost(); s.bellowsLv += 1; render(); };
  $("btn-age").onclick = () => {
    const c = ageCost();
    if (c === null || s.gold < c) return;
    s.gold -= c; s.ageIndex += 1; gainXp(20); flash(`${AGES[s.ageIndex].name}'e geçtin!`); render();
  };
  $("btn-save").onclick = () => save(false);
  $("btn-reset").onclick = () => {
    if (!confirm("Sıfırlansın mı?")) return;
    localStorage.removeItem(SAVE_KEY); s = def(); render();
  };
  render();
  setInterval(tick, 100);
  setInterval(() => save(true), 5000);
});
