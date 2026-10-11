// EmberAnvil v0.3 — ekonomi + ekipman (özgün içerik)
const AGES = [
  { name: "Taş Devri",  mult: 1,  cost: 0,     gear: "Taş Balta",    armor: "Kürk Yelek",   foe: "Kaya Golemi" },
  { name: "Orta Çağ",   mult: 2,  cost: 500,   gear: "Demir Kılıç",  armor: "Zincir Zırh",  foe: "Kara Şövalye" },
  { name: "Modern Çağ", mult: 4,  cost: 2500,  gear: "Çelik Pala",   armor: "Kompozit Yelek", foe: "Hurda Drone" },
  { name: "Uzay Çağı",  mult: 8,  cost: 12000, gear: "Plazma Baltası", armor: "Nano Zırh",   foe: "Void Akıncısı" },
  { name: "Kuantum Çağı", mult: 16, cost: 60000, gear: "Kuantum Kılıcı", armor: "Kuantum Pelerin", foe: "Entropi Lordu" },
];
// Üretilebilir silahlar: her çağda 2 kademe (özgün isimler)
const WEAPONS = [
  { id: "tas-balta",    name: "Taş Balta",     age: 0, ingot: 3,  atk: 6  },
  { id: "kemik-mizrak", name: "Kemik Mızrak",  age: 0, ingot: 6,  atk: 11 },
  { id: "demir-kilic",  name: "Demir Kılıç",   age: 1, ingot: 8,  atk: 22 },
  { id: "sovalye-teberi", name: "Şövalye Teberi", age: 1, ingot: 14, atk: 36 },
  { id: "celik-pala",   name: "Çelik Pala",    age: 2, ingot: 18, atk: 70 },
  { id: "titanyum-cekic", name: "Titanyum Çekiç", age: 2, ingot: 30, atk: 110 },
  { id: "plazma-baltasi", name: "Plazma Baltası", age: 3, ingot: 40, atk: 220 },
  { id: "nolcek-kamasi", name: "Nötrino Kaması", age: 3, ingot: 65, atk: 340 },
  { id: "kuantum-kilic", name: "Kuantum Kılıcı", age: 4, ingot: 90, atk: 700 },
  { id: "tekillik-orsu", name: "Tekillik Gürzü", age: 4, ingot: 150, atk: 1100 },
];
const SAVE_KEY = "emberanvil-v1";

const def = () => ({
  gold: 0, ore: 0, ingot: 0, level: 1, xp: 0,
  pickLv: 1, forgeLv: 1, bellowsLv: 0, ageIndex: 0,
  totalForged: 0, wins: 0, autoFight: true,
  owned: [], equipped: null, lastSeen: Date.now(),
});
let s = def();

const xpNeed = () => 20 * s.level;
const mineAmount = () => s.pickLv;
const forgeCost = () => 2;
const forgeGold = () => (10 + s.forgeLv * 8) * AGES[s.ageIndex].mult;
const perSec = () => s.bellowsLv * (2 + s.ageIndex * 2);
const pickCost = () => Math.floor(25 * Math.pow(1.6, s.pickLv - 1));
const forgeUpCost = () => Math.floor(50 * Math.pow(1.7, s.forgeLv - 1));
const bellowsCost = () => Math.floor(40 * Math.pow(1.65, s.bellowsLv));
const ageCost = () => (s.ageIndex + 1 >= AGES.length ? null : AGES[s.ageIndex + 1].cost);
const weaponAtk = (id) => (WEAPONS.find((w) => w.id === id)?.atk ?? 0);
function attackPower() {
  const base = 4 + s.forgeLv * 2 + s.level * 2;
  return Math.floor((base + weaponAtk(s.equipped)) * AGES[s.ageIndex].mult);
}

window.GAME = {
  get stats() {
    return { atk: attackPower(), level: s.level, age: s.ageIndex, auto: s.autoFight, equipped: s.equipped, owned: [...s.owned] };
  },
  onWin(r) { s.gold += r.gold; s.wins += 1; gainXp(r.xp); render(); },
};

function save(silent) {
  s.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  if (!silent) flash("Kaydedildi ✔");
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    s = Object.assign(def(), JSON.parse(raw));
    const dt = Math.min(Date.now() - (s.lastSeen || Date.now()), 8 * 3600 * 1000) / 1000;
    const gain = Math.floor(perSec() * dt);
    if (gain > 0) {
      s.gold += gain;
      document.getElementById("offline-msg").textContent =
        `Çevrimdışıyken +${gain} altın kazandın (${Math.floor(dt / 60)} dk).`;
    }
  } catch { /* yok say */ }
}
function gainXp(n) {
  s.xp += n;
  while (s.xp >= xpNeed()) { s.xp -= xpNeed(); s.level += 1; flash(`Seviye atladın! Lv ${s.level}`); }
}
function flash(m) {
  const el = document.getElementById("offline-msg");
  el.textContent = m;
  clearTimeout(flash.t);
  flash.t = setTimeout(() => { if (el.textContent === m) el.textContent = ""; }, 2500);
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
  $("atk").textContent = attackPower();
  $("equipped-name").textContent = WEAPONS.find((w) => w.id === s.equipped)?.name ?? "Yumruk";
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
  $("auto-t").textContent = s.autoFight ? "Açık" : "Kapalı";

  const c = ageCost();
  $("age-cost").textContent = c === null ? "MAX" : c;
  $("btn-age").disabled = c === null || s.gold < c;
  $("btn-smelt").disabled = s.ore < 2;
  $("btn-forge").disabled = s.ingot < forgeCost();
  $("btn-up-pick").disabled = s.gold < pickCost();
  $("btn-up-forge").disabled = s.gold < forgeUpCost();
  $("btn-up-bellows").disabled = s.gold < bellowsCost();

  $("ages").innerHTML = AGES.map((a, i) =>
    `<li class="${i < s.ageIndex ? "done" : i === s.ageIndex ? "now" : ""}">${a.name} (x${a.mult}) — ${a.gear} → ${a.foe}</li>`).join("");
  $("armor-list").innerHTML = AGES.map((a, i) =>
    `<li class="${i < s.ageIndex ? "done" : i === s.ageIndex ? "now" : ""}">${a.armor}${i === s.ageIndex ? " (giyiliyor)" : ""}</li>`).join("");

  // üretim listesi
  $("craft-list").innerHTML = "";
  WEAPONS.filter((w) => w.age <= s.ageIndex).forEach((w) => {
    const owned = s.owned.includes(w.id);
    const b = document.createElement("button");
    b.textContent = owned ? `✔ ${w.name} (+${w.atk})` : `⚒️ ${w.name} (+${w.atk}) — ${w.ingot} külçe`;
    b.disabled = owned || s.ingot < w.ingot;
    b.onclick = () => {
      if (s.ingot < w.ingot || s.owned.includes(w.id)) return;
      s.ingot -= w.ingot; s.owned.push(w.id); s.equipped = w.id; gainXp(10);
      window.dispatchEvent(new CustomEvent("ember-craft", { detail: w.id }));
      flash(`${w.name} dövüldü ve kuşanıldı!`); render();
    };
    $("craft-list").appendChild(b);
  });

  // envanter
  $("inv-list").innerHTML = s.owned.length ? "" : `<span class="muted">Henüz silahın yok — Üretim sekmesinden döv.</span>`;
  s.owned.forEach((id) => {
    const w = WEAPONS.find((x) => x.id === id);
    if (!w) return;
    const b = document.createElement("button");
    b.textContent = (s.equipped === id ? "✅ " : "🔶 ") + `${w.name} (+${w.atk})`;
    b.onclick = () => {
      s.equipped = id;
      window.dispatchEvent(new CustomEvent("ember-equip", { detail: id }));
      render();
    };
    $("inv-list").appendChild(b);
  });
  window.dispatchEvent(new CustomEvent("ember-stats"));
}

window.addEventListener("DOMContentLoaded", () => {
  load();
  const $ = (id) => document.getElementById(id);
  document.querySelectorAll(".tab").forEach((t) => {
    t.onclick = () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      document.querySelectorAll(".tabpage").forEach((p) => (p.hidden = true));
      $("tab-" + t.dataset.tab).hidden = false;
    };
  });
  $("btn-view-forge").onclick = () => {
    $("forge-view").hidden = false; $("arena-view").hidden = true;
    $("btn-view-forge").classList.add("active"); $("btn-view-arena").classList.remove("active");
  };
  $("btn-view-arena").onclick = () => {
    $("forge-view").hidden = true; $("arena-view").hidden = false;
    $("btn-view-arena").classList.add("active"); $("btn-view-forge").classList.remove("active");
  };
  $("btn-mine").onclick = () => { s.ore += mineAmount(); render(); };
  $("btn-smelt").onclick = () => { if (s.ore < 2) return; s.ore -= 2; s.ingot += 1; gainXp(2); render(); };
  $("btn-forge").onclick = () => {
    if (s.ingot < forgeCost()) return;
    s.ingot -= forgeCost(); s.gold += forgeGold(); s.totalForged += 1; gainXp(6);
    window.dispatchEvent(new CustomEvent("ember-smash")); render();
  };
  $("btn-up-pick").onclick = () => { if (s.gold < pickCost()) return; s.gold -= pickCost(); s.pickLv += 1; render(); };
  $("btn-up-forge").onclick = () => { if (s.gold < forgeUpCost()) return; s.gold -= forgeUpCost(); s.forgeLv += 1; render(); };
  $("btn-up-bellows").onclick = () => { if (s.gold < bellowsCost()) return; s.gold -= bellowsCost(); s.bellowsLv += 1; render(); };
  $("btn-age").onclick = () => {
    const cc = ageCost();
    if (cc === null || s.gold < cc) return;
    s.gold -= cc; s.ageIndex += 1; gainXp(20); flash(`${AGES[s.ageIndex].name}'e geçtin!`); render();
  };
  $("btn-save").onclick = () => save(false);
  $("btn-auto").onclick = () => { s.autoFight = !s.autoFight; render(); };
  $("btn-attack").onclick = () => window.dispatchEvent(new CustomEvent("ember-attack"));
  $("btn-next-foe").onclick = () => window.dispatchEvent(new CustomEvent("ember-next-foe"));
  $("btn-reset").onclick = () => {
    if (!confirm("Sıfırlansın mı?")) return;
    localStorage.removeItem(SAVE_KEY); s = def(); render();
  };
  render();
  setInterval(() => { s.gold += perSec() / 10; render(); }, 100);
  setInterval(() => save(true), 5000);
});
