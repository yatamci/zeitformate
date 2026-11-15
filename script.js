// Jedes Format ergibt H*M*S = 86400 Einheiten pro Tag -> 1 Format-Sekunde = 1 echte Sekunde.
// dial = Stunden auf dem Zifferblatt, sec = Minutenabschnitte pro Stundenstrich (dial*sec = M).
const FORMATS = [
  { name: "24/60/60", H: 24, M: 60, S: 60, dial: 12, sec: 5, sub: "Standard · 12-Std-Ziffernblatt · 2× täglich" },
  { name: "36/60/40", H: 36, M: 60, S: 40, dial: 12, sec: 5, sub: "12-Std-Ziffernblatt · 3× täglich · 40 s je Minute" },
  { name: "36/48/50", H: 36, M: 48, S: 50, dial: 12, sec: 4, sub: "12-Std-Ziffernblatt · 4 Abschnitte je Stunde" },
  { name: "30/60/48", H: 30, M: 60, S: 48, dial: 10, sec: 6, sub: "10-Std-Ziffernblatt · 3× täglich · 6 Abschnitte" }
];
const pad = n => String(n).padStart(2, "0");
const $ = id => document.getElementById(id);

function makeCard(f) {
  const el = document.createElement("article");
  el.className = "glass card";
  const total = f.dial * f.sec;
  let ticks = "", nums = "";
  for (let i = 0; i < total; i++) {
    const major = i % f.sec === 0, len = major ? 10 : 5;
    ticks += `<line class="${major ? "t-major" : "t-minor"}" x1="100" y1="${100 - 94}" x2="100" y2="${100 - 94 + len}" transform="rotate(${(i / total) * 360} 100 100)"/>`;
  }
  for (let i = 1; i <= f.dial; i++) {
    const a = (i / f.dial) * 2 * Math.PI;
    nums += `<text class="num" x="${100 + Math.sin(a) * 72}" y="${100 - Math.cos(a) * 72}">${i}</text>`;
  }
  el.innerHTML = `<h2>${f.name}</h2><p class="sub">${f.sub}</p>
    <svg class="dial" viewBox="0 0 200 200" role="img" aria-label="Analoguhr ${f.name}">
      <circle class="face" cx="100" cy="100" r="97"/>${ticks}${nums}
      <line class="hand hour" x1="100" y1="100" x2="100" y2="58"/>
      <line class="hand min" x1="100" y1="100" x2="100" y2="34"/>
      <line class="hand sec" x1="100" y1="112" x2="100" y2="24"/>
      <circle class="pin" cx="100" cy="100" r="4.5"/>
    </svg><div class="digital">00:00:00</div>`;
  const q = s => el.querySelector(s), rot = (n, a) => n.setAttribute("transform", `rotate(${a} 100 100)`);
  const hour = q(".hour"), min = q(".min"), sec = q(".sec"), dig = q(".digital");
  const MS = f.M * f.S, D = f.dial * MS;
  let last = "";
  // t = Sekunden seit Mitternacht (Dezimalzahl)
  el.set = t => {
    const u = Math.floor(t), h = Math.floor(u / MS), m = Math.floor((u % MS) / f.S), s = u % f.S;
    const txt = `${pad(h)}:${pad(m)}:${pad(s)}`;
    if (txt !== last) { dig.textContent = txt; last = txt; }
    rot(hour, ((t % D) / D) * 360);
    rot(min, ((t % MS) / MS) * 360);
    rot(sec, ((t % f.S) / f.S) * 360);
  };
  return el;
}

// Live
const liveCards = FORMATS.map(makeCard);
liveCards.forEach(c => $("liveGrid").appendChild(c));
const nowSeconds = () => { const d = new Date(); return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000; };
(function tick() { const t = nowSeconds(); liveCards.forEach(c => c.set(t)); requestAnimationFrame(tick); })();

// Konverter
const convCards = FORMATS.map(makeCard);
convCards.forEach(c => $("convGrid").appendChild(c));
FORMATS.forEach((f, i) => $("src").add(new Option(f.name, i)));
const inputs = [$("ih"), $("im"), $("is")];

function limits() {
  const f = FORMATS[$("src").value];
  [f.H, f.M, f.S].forEach((max, i) => { inputs[i].max = max - 1; });
  return f;
}
function convert() {
  const f = limits(), v = inputs.map(i => i.value === "" ? NaN : Number(i.value));
  const lim = [f.H, f.M, f.S], names = ["Stunden", "Minuten", "Sekunden"];
  for (let i = 0; i < 3; i++) {
    if (!Number.isInteger(v[i]) || v[i] < 0 || v[i] >= lim[i]) {
      $("err").textContent = `${names[i]}: bitte eine ganze Zahl von 0 bis ${lim[i] - 1} eingeben.`;
      return;
    }
  }
  $("err").textContent = "";
  const t = v[0] * f.M * f.S + v[1] * f.S + v[2];
  convCards.forEach(c => c.set(t));
}
inputs.forEach(i => i.addEventListener("input", convert));
$("src").addEventListener("change", convert);
$("now").addEventListener("click", () => {
  const f = limits(), u = Math.floor(nowSeconds()), MS = f.M * f.S;
  inputs[0].value = Math.floor(u / MS);
  inputs[1].value = Math.floor((u % MS) / f.S);
  inputs[2].value = u % f.S;
  convert();
});
convert();

// Tabs
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x === b));
  document.querySelectorAll(".view").forEach(v => { v.hidden = v.id !== b.dataset.tab; });
}));

// Theme
const root = document.documentElement;
let theme = null;
try { theme = localStorage.getItem("theme"); } catch (e) {}
if (!theme) theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
root.dataset.theme = theme;
$("theme").addEventListener("click", () => {
  theme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = theme;
  try { localStorage.setItem("theme", theme); } catch (e) {}
});
