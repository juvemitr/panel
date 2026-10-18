import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, collection, onSnapshot, setDoc, addDoc, deleteDoc, getDoc, query, orderBy, limit, writeBatch, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyAJuXuCwgFVVNfn9ASWOlynInHx-FZMd5A",
  authDomain: "juvemi-panel.firebaseapp.com",
  projectId: "juvemi-panel",
  storageBucket: "juvemi-panel.firebasestorage.app",
  messagingSenderId: "682135124548",
  appId: "1:682135124548:web:e518165b22de294ab91a11"
});
const auth = getAuth(app), db = getFirestore(app);
const DOMAIN = "@juvemi-panel.firebaseapp.com";
const ADLAR = { mustafa: "Mustafa", rumeysa: "Rumeysa", fatmanur: "Fatma Nur" };

const $ = id => document.getElementById(id);
const ST = ["acik", "devam", "bitti"], LBL = { acik: "Açık", devam: "Devam ediyor", bitti: "Bitti" };
const TAG = { bos: "Henüz yok", acik: "Açık", devam: "Devam ediyor", bitti: "Bitti", bilgi: "Bilgi" };
const KAT = ["Alan adı & hosting", "Yazılım & abonelik", "Tasarım araçları", "Baskı & numune", "Reklam & tanıtım", "Resmi işlemler", "Malzeme", "Diğer"];
const ODEYEN = ["Mustafa", "Rumeysa", "Fatma Nur", "Ortak kasa"], ORTAK = ["Mustafa", "Rumeysa", "Fatma Nur"];
const TL = n => "₺" + Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

let ME = null, MYNAME = "", ozet = null, mods = [], giderler = [], gunluk = [], etk = [], sermaye = [], butce = {}, ekip = [], EDIT = null, durum = {}, KADI = "", mesajlar = [], toplantilar = [], ST_SON = null, ST_YUK = false, haftalar = [], yol = [], YHEDIT = null, TPACIK = null, TPEDIT = null, panel = { gorevler: [] }, unsub = [];
let TAB = (location.hash || "").slice(1) || (() => { try { return localStorage.getItem("juvemi-tab"); } catch (e) { } })() || "ana";
function flash(m) { $("status").textContent = m; clearTimeout(flash.t); flash.t = setTimeout(() => $("status").textContent = "", 2500); }

/* ---------- giriş ---------- */
$("loginform").onsubmit = async e => {
  e.preventDefault();
  const k = $("l-user").value.trim().toLowerCase().replace(/\s+/g, ""), p = $("l-pass").value;
  if (!k || !p) return;
  $("l-err").textContent = ""; $("l-btn").disabled = true;
  try { await setPersistence(auth, browserLocalPersistence); await signInWithEmailAndPassword(auth, (k.includes("@") ? k : k + DOMAIN), p); $("l-pass").value = ""; }
  catch (err) { $("l-err").textContent = "Kullanıcı adı ya da şifre yanlış."; }
  $("l-btn").disabled = false;
};
$("logout").onclick = () => { kalp(false); KADI = ""; signOut(auth); };
$("pwopen").onclick = () => { const f = $("pwform"); f.hidden = !f.hidden; $("pw-msg").textContent = ""; if (!f.hidden) $("pw-old").focus(); };
$("pwform").onsubmit = async e => {
  e.preventDefault(); const m = $("pw-msg"), o = $("pw-old").value, n = $("pw-new").value;
  if (n.length < 6) { m.textContent = "Yeni şifre en az 6 karakter olmalı."; return; }
  if (n !== $("pw-new2").value) { m.textContent = "Yeni şifreler aynı değil."; return; }
  try {
    const u = auth.currentUser; await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, o)); await updatePassword(u, n);
    ["pw-old", "pw-new", "pw-new2"].forEach(i => $(i).value = ""); m.textContent = "Şifren değişti. Bir dahaki girişte yenisini kullan.";
    setTimeout(() => { $("pwform").hidden = true; }, 2500);
  } catch (err) { m.textContent = (err && err.code === "auth/invalid-credential") || (err && err.code === "auth/wrong-password") ? "Mevcut şifre yanlış." : "Şifre değiştirilemedi, tekrar dene."; }
};

onAuthStateChanged(auth, u => {
  unsub.forEach(f => f()); unsub = [];
  if (!u) { ME = null; $("gate").hidden = false; $("app").hidden = true; setTimeout(() => $("l-user").focus(), 50); return; }
  ME = u.uid; const kadi = (u.email || "").split("@")[0]; MYNAME = ADLAR[kadi] || kadi;
  $("gate").hidden = true; $("app").hidden = false; $("whoname").textContent = MYNAME; $("whoname").parentElement.dataset.ini = (MYNAME[0] || "?").toUpperCase();
  start(kadi);
});

const IC = {
  geri: '<path d="M4 5h16v11H9l-5 4z"/><path d="M9 9h6M9 12h4"/>',
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  pano: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  gorev: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
  takvim: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  gider: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  butce: '<path d="M21 12A9 9 0 1 1 12 3"/><path d="M12 3a9 9 0 0 1 9 9h-9z"/>',
  finans: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v.01M18 14.5v.01"/>',
  urunler: '<path d="m12 2.5 8.5 4.5v10L12 21.5 3.5 17V7z"/><path d="m3.5 7 8.5 4.5L20.5 7M12 11.5v10"/>',
  musteriler: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.7 2.8 2.4 3 5.2"/>',
  pazarlama: '<path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M17 8.5a5 5 0 0 1 0 7"/>',
  magaza: '<path d="M3.5 9 5 3.5h14L20.5 9"/><path d="M3.5 9a2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.8 0 2.8 2.8 0 0 0 5.6 0"/><path d="M5 11.5V21h14v-9.5M10 21v-5h4v5"/>',
  sirket: '<path d="M12 3v18M5 7h14M7.5 7 4 14a3.5 3.5 0 0 0 7 0zM16.5 7 13 14a3.5 3.5 0 0 0 7 0z"/><path d="M8 21h8"/>',
  ekip: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21c.7-4 3.4-6.5 7-6.5s6.3 2.5 7 6.5"/>',
  ekipapp: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.6c2.6.2 4.4 2 5 5.4"/>',
  sohbet: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.8A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  toplanti: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>',
  toplantilar: '<path d="M8 3h8l4 4v14H4V3z"/><path d="M16 3v4h4M8 11h8M8 15h8M8 19h5"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  yol: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  ayar: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  menu: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4v16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/>',
  auto: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  dot: '<circle cx="12" cy="12" r="3"/>'
};
const svg = (k, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k] || IC.dot}</svg>`;
/* ---------- uygulamalar ---------- */
const APPS = [
  { id: "genel", ad: "Pano", renk: "#5B7FA0", ik: "pano", alt: () => "Özet, riskler, günlük" },
  { id: "gorevler", ad: "Görevlerim", renk: "#3F8F5F", ik: "gorev", alt: () => { const n = (panel.gorevler || []).filter(t => t.durum !== "bitti").length; return n + " açık görev"; } },
  { id: "takvim", ad: "Takvim", renk: "#C98A1B", ik: "takvim", alt: () => { const t = bugun(), n = etk.filter(e => e.tarih >= t).length; return n ? n + " yaklaşan etkinlik" : "Ortak + kişisel"; } },
  { id: "giderler", ad: "Giderler", renk: "#C8463E", ik: "gider", alt: () => TL(giderler.reduce((s, g) => s + (+g.tutar || 0), 0)) },
  { id: "sohbet", ad: "Sohbet", renk: "#3E7CC9", ik: "sohbet", alt: () => { const n = okunmamis(); return n ? n + " yeni mesaj" : "Ekip içi mesajlaşma"; } },
  { id: "yol", ad: "Yol Haritası", renk: "#2E8B6E", ik: "yol", alt: () => { const n = yol.length, b = yol.filter(x => x.durum === "bitti").length; return n ? b + " / " + n + " hedef tamam" : "Fazlar ve hedefler"; } },
  { id: "toplantilar", ad: "Toplantılar", renk: "#4F6BB8", ik: "toplantilar", alt: () => toplantilar.length ? toplantilar.length + " kayıt · son " + new Date(toplantilar[0].tarih + "T12:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : "Haftalık değerlendirmeler" },
  { id: "toplanti", ad: "Görüntülü Görüşme", renk: "#D06A2C", ik: "toplanti", alt: () => "Jitsi ekip odası" },
  { id: "ekip", ad: "Ekip", renk: "#2F8C8C", ik: "ekipapp", alt: () => ekip.length ? ekip.length + " kurucu ortak" : "Kurucu ortaklar" },
  { id: "butce", ad: "Bütçe & Sermaye", renk: "#7A6CB0", ik: "butce", alt: () => { const s = sermaye.reduce((t, x) => t + (+x.tutar || 0), 0); return s ? "Sermaye " + TL(s) : "Sermaye ve aylık plan"; } },
  { id: "geri", ad: "Geri Bildirim", renk: "#B5527A", ik: "geri", alt: () => { const n = (geri || []).filter(x => (x.durum || "yeni") === "yeni").length; return n ? n + " yeni kayıt" : "Talepler, öneriler, hatalar"; } },
  { id: "ayarlar", ad: "Ayarlar", renk: "#6B7280", ik: "ayar", sadece: "mustafa", alt: () => ST_SON ? "Depolama %" + ST_SON.pct.toFixed(3) : "Depolama ve sınırlar" }
];
function go(t) { TAB = t; try { localStorage.setItem("juvemi-tab", t); } catch (e) { } history.replaceState(null, "", "#" + t); renderTabs(); scrollTo(0, 0); }
$("logo").onclick = () => go("ana");
addEventListener("hashchange", () => { const t = location.hash.slice(1); if (t && t !== TAB) { TAB = t; renderTabs(); } });
const narrow = () => matchMedia("(max-width:980px)").matches;
let SIDE = (() => { try { return localStorage.getItem("juvemi-side") || ""; } catch (e) { return ""; } })();
function applySide() { const s = $("app"); s.classList.toggle("mini", SIDE === "mini"); s.classList.toggle("wide", SIDE === "wide"); }
$("sidetog").innerHTML = svg("menu", 18); applySide();
$("sidetog").onclick = () => { const kapali = SIDE === "mini" || (narrow() && SIDE !== "wide"); SIDE = kapali ? (narrow() ? "wide" : "") : "mini"; try { localStorage.setItem("juvemi-side", SIDE); } catch (e) { } applySide(); };
const TEMA = ["", "light", "dark"], TEMAAD = { "": "Sistem teması", light: "Açık tema", dark: "Koyu tema" }, TEMAIK = { "": "auto", light: "sun", dark: "moon" };
function applyTheme(t) { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; $("themelbl").textContent = TEMAAD[t]; $("themebtn").querySelector(".si").innerHTML = svg(TEMAIK[t]); $("themebtn").title = TEMAAD[t] + " (değiştirmek için tıkla)"; }
let THEME = (() => { try { return localStorage.getItem("juvemi-theme") || ""; } catch (e) { return ""; } })(); applyTheme(THEME);
$("themebtn").onclick = () => { THEME = TEMA[(TEMA.indexOf(THEME) + 1) % 3]; try { localStorage.setItem("juvemi-theme", THEME); } catch (e) { } applyTheme(THEME); };
function renderTabs() {
  const mod = mods.find(m => m.id === TAB), app = APPS.find(x => x.id === TAB && !x.yakinda && (!x.sadece || x.sadece === KADI));
  if (!app && APPS.some(x => x.id === TAB && x.sadece) && KADI) TAB = "ana";
  if (!mod && !app && TAB !== "ana" && mods.length) TAB = "ana";
  $("apptitle").textContent = mod ? mod.ad : (app ? app.ad : "Uygulamalar");
  $("sidenav").innerHTML = `<button type="button" class="nav-i" data-t="ana"${TAB === "ana" ? ' aria-current="page"' : ""} title="Ana ekran"><span class="si">${svg("home")}</span><span class="sl">Ana ekran</span></button>`
    + APPS.filter(x => !x.sadece || x.sadece === KADI).map(x => `<button type="button" class="nav-i" data-t="${x.id}"${x.yakinda ? " disabled" : ""}${TAB === x.id ? ' aria-current="page"' : ""} title="${esc(x.ad)}"><span class="si" style="--c:${x.renk}">${svg(x.ik)}</span><span class="sl">${esc(x.ad)}</span>${x.id === "sohbet" && okunmamis() ? `<span class="nbadge">${okunmamis()}</span>` : ""}</button>`).join("")
    + (mods.length ? `<div class="side-sep">Şirket</div>` + mods.map(m => `<button type="button" class="nav-i nm" data-t="${esc(m.id)}"${TAB === m.id ? ' aria-current="page"' : ""} title="${esc(m.ad)}"><span class="si">${svg(m.id)}</span><span class="sl">${esc(m.ad)}</span></button>`).join("") : "");
  $("sidenav").querySelectorAll(".nav-i:not([disabled])").forEach(b => b.onclick = () => go(b.dataset.t));
  document.querySelectorAll(".pane").forEach(p => p.hidden = !(p.dataset.pane === TAB || (mod && p.dataset.pane === "mod")));
  $("apps").innerHTML = APPS.filter(x => !x.sadece || x.sadece === KADI).map(x => `<button type="button" class="app" data-t="${x.id}"${x.yakinda ? " disabled" : ""}><i style="--c:${x.renk}">${svg(x.ik, 24)}</i><b>${esc(x.ad)}</b><span>${esc(x.alt())}</span></button>`).join("");
  $("apps").querySelectorAll(".app:not([disabled])").forEach(b => b.onclick = () => go(b.dataset.t));
  if (mod) $("modpane").innerHTML = `<section><p class="muted" style="margin:0 0 12px">${esc(mod.aciklama)}</p><div class="mods">${(mod.bolumler || []).map(b => `<div class="mod"><div class="row"><b>${esc(b.ad)}</b><span class="tag ${esc(b.durum)}">${TAG[b.durum] || esc(b.durum)}</span></div>${b.not ? `<div class="muted">${esc(b.not)}</div>` : ""}</div>`).join("")}</div></section>`;
  if (TAB === "takvim") renderCal();
  if (TAB === "butce") renderButce();
  if (TAB === "ekip") renderEkip();
  if (TAB === "toplantilar") renderTp();
  if (TAB === "yol") renderYol();
  if (TAB === "geri") renderGeri();
  if (TAB === "ayarlar" && KADI === "mustafa" && !ST_SON && !ST_YUK) hesapla();
  renderUpl();
  if (TAB === "sohbet") { renderChat(); okundu(); }
  if (TAB !== "toplanti" && $("meetframe").querySelector("iframe")) meetEnd();
  renderOnline();
}

/* ---------- takvim ---------- */
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const bugun = () => iso(new Date());
let CAL = (() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; })(), SEL = bugun();
function itemsOn(t) {
  const o = etk.filter(e => e.tarih === t).sort((a, b) => (a.saat || "99").localeCompare(b.saat || "99")).map(e => ({ tip: "o", e }));
  const k = (panel.gorevler || []).filter(g => g.tarih === t).map(g => ({ tip: "k", g }));
  return o.concat(k);
}
function renderCal() {
  $("cal-title").textContent = AYLAR[CAL.m] + " " + CAL.y;
  const first = new Date(CAL.y, CAL.m, 1), start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
  let html = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(d => `<div class="dow">${d}</div>`).join("");
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); const t = iso(d), its = itemsOn(t);
    if (i === 35 && d.getMonth() !== CAL.m) break;
    html += `<button type="button" class="day${d.getMonth() !== CAL.m ? " out" : ""}${t === bugun() ? " today" : ""}${t === SEL ? " sel" : ""}" data-d="${t}"><span class="dn">${d.getDate()}</span>${its.slice(0, 3).map(x => x.tip === "o" ? `<span class="ev o">${esc((x.e.saat ? x.e.saat + " " : "") + x.e.baslik)}</span>` : `<span class="ev k${x.g.durum === "bitti" ? " d" : ""}">${esc(x.g.baslik)}</span>`).join("")}${its.length > 3 ? `<span class="more">+${its.length - 3}</span>` : ""}</button>`;
  }
  $("cal").innerHTML = html;
  $("cal").querySelectorAll(".day").forEach(b => b.onclick = () => { SEL = b.dataset.d; renderCal(); });
  const sd = new Date(SEL + "T12:00");
  $("day-title").textContent = sd.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  const its = itemsOn(SEL);
  $("daylist").innerHTML = its.map((x, i) => x.tip === "o"
    ? `<li><span class="chip" style="background:var(--wipbg);color:var(--mustard)">Ortak</span><span>${x.e.saat ? `<b>${esc(x.e.saat)}</b> · ` : ""}${esc(x.e.baslik)} <span class="muted">· ${esc(x.e.ekleyen || "")}</span></span><button type="button" class="del" data-id="${esc(x.e.id)}">Sil</button></li>`
    : `<li><span class="chip">Görevim</span><span>${esc(x.g.baslik)} <span class="muted">· ${LBL[x.g.durum || "acik"]}</span></span></li>`).join("") || '<li class="muted" style="border-style:dashed">Bu gün için kayıt yok.</li>';
  $("daylist").querySelectorAll(".del").forEach(b => b.onclick = () => {
    if (!b.classList.contains("sure")) { b.classList.add("sure"); b.textContent = "Tekrar tıkla"; setTimeout(() => { b.classList.remove("sure"); b.textContent = "Sil"; }, 4000); return; }
    deleteDoc(doc(db, "etkinlikler", b.dataset.id)).then(() => flash("Silindi")).catch(() => flash("Silinemedi"));
  });
}
$("cal-prev").onclick = () => { CAL.m--; if (CAL.m < 0) { CAL.m = 11; CAL.y--; } renderCal(); };
$("cal-next").onclick = () => { CAL.m++; if (CAL.m > 11) { CAL.m = 0; CAL.y++; } renderCal(); };
$("cal-today").onclick = () => { const d = new Date(); CAL = { y: d.getFullYear(), m: d.getMonth() }; SEL = bugun(); renderCal(); };
$("calform").onsubmit = e => {
  e.preventDefault(); const b = $("c-baslik").value.trim(); if (!b) return;
  if ($("c-tur").value === "k") { panel.gorevler.push({ id: "g" + Date.now(), baslik: b, aciklama: "", durum: "acik", not: "", tarih: SEL }); savePanel(); $("c-baslik").value = ""; renderCal(); return; }
  addDoc(collection(db, "etkinlikler"), { tarih: SEL, saat: $("c-saat").value || "", baslik: b, ekleyen: MYNAME, ts: Date.now() })
    .then(() => { $("c-baslik").value = ""; $("c-saat").value = ""; flash("Takvime eklendi"); }).catch(() => flash("Eklenemedi"));
};

/* ---------- genel ---------- */
function renderGenel() {
  if (ozet) {
    $("facts").innerHTML = (ozet.netlesenler || []).map(f => `<div class="fact${f.acik ? " pend" : ""}"><b>${esc(f.b)}</b><span>${esc(f.v)}</span></div>`).join("") || '<div class="empty">Henüz kayıt yok.</div>';
    $("risks").innerHTML = (ozet.riskler || []).map(r => `<li>${esc(r)}</li>`).join("");
  } else $("facts").innerHTML = '<div class="empty">Henüz kayıt yok.</div>';
  $("ov").innerHTML = mods.map(m => { const B = m.bolumler || [], n = B.filter(b => b.durum !== "bos").length; return `<button class="fact ovc" data-t="${esc(m.id)}"><b style="display:flex;align-items:center;gap:8px">${svg(m.id, 16)}${esc(m.ad)}</b><span>${n} / ${B.length} başladı</span></button>`; }).join("");
  const top = giderler.reduce((s, g) => s + (+g.tutar || 0), 0);
  $("gozet").innerHTML = `<button class="fact ovc" data-t="giderler"><b>Toplam harcama</b><span>${TL(top)}</span></button><button class="fact ovc" data-t="giderler"><b>Kayıt sayısı</b><span>${giderler.length} gider</span></button>`;
  document.querySelectorAll("#ov .ovc,#gozet .ovc").forEach(b => b.onclick = () => go(b.dataset.t));
  $("log").innerHTML = gunluk.map(l => { const t = new Date(l.ts).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); return `<li><time>${esc(t)}</time><span>${l.yazan ? `<b>${esc(l.yazan)}</b> · ` : ""}${esc(l.metin)}</span></li>`; }).join("") || '<li class="muted">Henüz kayıt yok.</li>';
}

/* ---------- görevlerim ---------- */
let DRAG = null;
function savePanel() { setTimeout(renderTabs, 0); setDoc(doc(db, "kullanicilar", ME), { ad: MYNAME, gorevler: panel.gorevler }).then(() => flash("Kaydedildi")).catch(() => flash("Kaydedilemedi")); renderTasks(); }
const altTum = L => (L || []).reduce((s, x) => s.concat([x], altTum(x.altlar)), []);
function altBul(L, id, ust) { for (const x of L || []) { if (x.id === id) return { x, liste: L, ust }; const r = altBul(x.altlar, id, x); if (r) return r; } return null; }
function altDuzelt(L) { (L || []).forEach(x => { if ((x.altlar || []).length) { altDuzelt(x.altlar); x.ok = x.altlar.every(z => z.ok); } }); }
function altLi(L, d) {
  return `<ul class="alt-ul${d ? " ic" : ""}">${(L || []).map(x => { const C = x.altlar || [], cy = altTum(C).filter(z => z.ok).length, ct = altTum(C).length;
    return `<li class="${x.ok ? "ok" : ""}" data-a="${esc(x.id)}"><div class="alt-sat"><input type="checkbox" ${x.ok ? "checked" : ""}><span class="alt-ad" contenteditable="true" spellcheck="false" title="Düzenlemek için tıkla">${esc(x.ad)}</span>${ct ? `<span class="alt-say">${cy}/${ct}</span>` : ""}${d < 3 ? `<button type="button" class="alt-art" title="Bunun altına iş ekle">＋</button>` : ""}<button type="button" class="alt-duz" title="Düzenle">✎</button><button type="button" class="alt-sil" title="Sil">✕</button></div>
    ${C.length ? altLi(C, d + 1) : ""}<form class="alt-ekle alt-ic" hidden><input type="text" placeholder="+ Alt görev ekle" maxlength="140"><button type="submit">Ekle</button></form></li>`; }).join("")}</ul>`;
}
function altHTML(t) {
  const T = altTum(t.altlar), y = T.filter(x => x.ok).length, yz = T.length ? Math.round(100 * y / T.length) : 0;
  return `<div class="alt">${T.length ? `<div class="alt-ust"><span>Alt işler</span><b>${y} / ${T.length}</b><div class="alt-bar"><i style="width:${yz}%"></i></div><em>%${yz}</em></div>` : ""}
  ${altLi(t.altlar, 0)}
  <form class="alt-ekle alt-kok"><input type="text" placeholder="+ Alt iş ekle" maxlength="140"><button type="submit">Ekle</button></form></div>`;
}
function altBagla(c, t) {
  const durumGuncelle = () => { altDuzelt(t.altlar); const A = t.altlar || []; if (A.length && A.every(z => z.ok)) t.durum = "bitti"; else if (altTum(A).some(z => z.ok)) t.durum = "devam"; else if (t.durum === "bitti") t.durum = "devam"; };
  c.querySelectorAll(".alt li").forEach(li => {
    const r = altBul(t.altlar, li.dataset.a); if (!r) return; const x = r.x, sat = li.querySelector(":scope > .alt-sat");
    sat.querySelector("input").onchange = e => { const v = e.target.checked; x.ok = v; altTum(x.altlar).forEach(z => z.ok = v); durumGuncelle(); savePanel(); };
    const ad = sat.querySelector(".alt-ad");
    sat.querySelector(".alt-duz").onclick = () => { ad.focus(); const rg = document.createRange(); rg.selectNodeContents(ad); rg.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(rg); };
    ad.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); ad.blur(); } if (e.key === "Escape") { ad.textContent = x.ad; ad.blur(); } };
    ad.onpaste = e => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain").replace(/\s+/g, " ")); };
    ad.onblur = () => { const v = ad.textContent.trim(); if (!v) { ad.textContent = x.ad; return; } if (v !== x.ad) { x.ad = v; savePanel(); } };
    sat.querySelector(".alt-sil").onclick = () => { r.liste.splice(r.liste.indexOf(x), 1); durumGuncelle(); savePanel(); };
    const f = li.querySelector(":scope > .alt-ic"), art = sat.querySelector(".alt-art");
    if (art) art.onclick = () => { f.hidden = !f.hidden; if (!f.hidden) f.querySelector("input").focus(); };
    f.querySelector("input").id = "alt-" + x.id;
    f.onsubmit = e => { e.preventDefault(); const v = f.querySelector("input").value.trim(); if (!v) return; (x.altlar = x.altlar || []).push({ id: Date.now().toString(36), ad: v, ok: false }); x.ok = false; durumGuncelle(); savePanel(); setTimeout(() => { const n = $("alt-" + x.id); if (n) { n.closest("form").hidden = false; n.focus(); } }, 60); };
  });
  const f = c.querySelector(".alt-kok"), inp = f.querySelector("input");
  inp.id = "alt-" + t.id;
  f.onsubmit = e => { e.preventDefault(); const v = inp.value.trim(); if (!v) return; (t.altlar = t.altlar || []).push({ id: Date.now().toString(36), ad: v, ok: false }); if (t.durum === "bitti") t.durum = "devam"; savePanel(); setTimeout(() => { const n = $("alt-" + t.id); n && n.focus(); }, 50); };
}
function renderTasks() {
  const g = panel.gorevler || [], done = g.filter(t => t.durum === "bitti").length;
  $("pnum").textContent = done + " / " + g.length; $("barfill").style.width = (g.length ? 100 * done / g.length : 0) + "%";
  const el = $("tasks");
  if (!g.length) { el.innerHTML = '<div class="empty">Henüz görevin yok. Yukarıdan ilk görevini ekle.</div>'; return; }
  const focused = document.activeElement && document.activeElement.id; el.innerHTML = "";
  g.forEach((t, i) => {
    const s = t.durum || "acik", c = document.createElement("article"); c.className = "task" + (s === "bitti" ? " done" : ""); c.dataset.id = t.id;
    c.innerHTML = `<div class="num" title="Tutup sürükle">${i + 1}<small>⋮⋮</small></div><div class="ttl ed" contenteditable="true" spellcheck="false" data-k="baslik" data-ph="Görev başlığı" title="Düzenlemek için tıkla">${esc(t.baslik)}</div><button class="pill" data-s="${s}" type="button">${LBL[s]}</button><div class="desc ed" contenteditable="true" spellcheck="false" data-k="aciklama" data-ph="+ Açıklama ekle" title="Düzenlemek için tıkla">${esc(t.aciklama || "")}</div>${altHTML(t)}<input type="date" class="tdate" value="${esc(t.tarih || "")}" aria-label="Tarih" title="Tarih (takvimde görünür)"><textarea class="note" id="n-${esc(t.id)}" placeholder="Not ekle…">${esc(t.not || "")}</textarea><button class="del" type="button">Sil</button>`;
    c.querySelector(".pill").onclick = () => { t.durum = ST[(ST.indexOf(s) + 1) % 3]; savePanel(); };
    altBagla(c, t);
    c.querySelectorAll(".ed").forEach(ed => {
      const k = ed.dataset.k;
      ed.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); ed.blur(); } if (e.key === "Escape") { ed.textContent = t[k] || ""; ed.blur(); } };
      ed.onpaste = e => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain").replace(/\s+/g, " ")); };
      ed.onblur = () => { const v = ed.textContent.trim(); if (k === "baslik" && !v) { ed.textContent = t.baslik; return; } if (!v) ed.innerHTML = ""; if (v !== (t[k] || "")) { t[k] = v; savePanel(); } };
    });
    const nt = c.querySelector(".note"), boy = () => { nt.style.height = "auto"; nt.style.height = Math.max(38, nt.scrollHeight + 2) + "px"; }; nt.oninput = boy; requestAnimationFrame(boy);
    const td = c.querySelector(".tdate"); td.onchange = () => { t.tarih = td.value; savePanel(); };
    const ta = c.querySelector("textarea"); ta.onchange = () => { t.not = ta.value; savePanel(); };
    const del = c.querySelector(".del"); del.onclick = () => { if (!del.classList.contains("sure")) { del.classList.add("sure"); del.textContent = "Emin misin? Silmek için tekrar tıkla"; setTimeout(() => { del.classList.remove("sure"); del.textContent = "Sil"; }, 4000); return; } panel.gorevler = panel.gorevler.filter(x => x.id !== t.id); savePanel(); };
    c.onpointerdown = e => {
      if (e.button > 0 || e.target.closest("input,textarea,button,a,[contenteditable]")) return;
      if (e.pointerType !== "mouse" && !e.target.closest(".num")) return;
      e.preventDefault(); const y0 = e.clientY, x0 = e.clientX; let basladi = false, hayalet = null, dx = 0, dy = 0;
      const bas = () => {
        basladi = true; DRAG = t.id; document.body.style.userSelect = "none"; document.body.classList.add("suruklen");
        const r = c.getBoundingClientRect(); dx = x0 - r.left; dy = y0 - r.top;
        hayalet = c.cloneNode(true); hayalet.classList.add("hayalet"); hayalet.style.width = r.width + "px"; hayalet.style.left = r.left + "px"; hayalet.style.top = r.top + "px";
        document.body.appendChild(hayalet); c.style.height = r.height + "px"; c.classList.add("yuva");
      };
      if (e.pointerType !== "mouse") bas();
      const mv = ev => {
        if (!basladi) { if (Math.abs(ev.clientY - y0) < 5) return; bas(); }
        ev.preventDefault(); hayalet.style.left = (ev.clientX - dx) + "px"; hayalet.style.top = (ev.clientY - dy) + "px";
        const kart = [...el.querySelectorAll(".task:not(.yuva)")];
        let once = null; for (const k of kart) { const r = k.getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { once = k; break; } }
        if (once) { if (c.nextElementSibling !== once) el.insertBefore(c, once); } else if (el.lastElementChild !== c) el.appendChild(c);
        if (ev.clientY < 70) scrollBy(0, -14); else if (ev.clientY > innerHeight - 70) scrollBy(0, 14);
      };
      const up = () => {
        removeEventListener("pointermove", mv); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); if (!basladi) return;
        document.body.style.userSelect = ""; document.body.classList.remove("suruklen"); DRAG = null;
        const r = c.getBoundingClientRect(); hayalet.style.transition = "left .15s, top .15s, transform .15s, box-shadow .15s"; hayalet.style.left = r.left + "px"; hayalet.style.top = r.top + "px"; hayalet.style.transform = "none";
        setTimeout(() => { hayalet.remove(); c.classList.remove("yuva"); c.style.height = "";
          const sira = [...el.querySelectorAll(".task")].map(x => x.dataset.id), eski = panel.gorevler.map(x => x.id).join();
          if (sira.join() !== eski) { panel.gorevler.sort((p, q) => sira.indexOf(p.id) - sira.indexOf(q.id)); savePanel(); } else renderTasks(); }, 160);
      };
      addEventListener("pointermove", mv, { passive: false }); addEventListener("pointerup", up); addEventListener("pointercancel", up);
    };
    el.appendChild(c);
  });
  if (focused && $(focused)) $(focused).focus();
}

/* ---------- giderler ---------- */
function rows(el, map, cls) { const mx = Math.max(1, ...Object.values(map)); el.innerHTML = Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="row ${cls}"><span>${esc(k)}</span><div class="bar"><i style="width:${100 * v / mx}%"></i></div><span class="amt">${TL(v)}</span></div>`).join("") || '<div class="muted">Henüz gider yok.</div>'; }
function renderGider() {
  const top = giderler.reduce((s, g) => s + (+g.tutar || 0), 0); $("gtop").textContent = TL(top);
  const kisi = {}, kat = {}; giderler.forEach(g => { kisi[g.odeyen] = (kisi[g.odeyen] || 0) + (+g.tutar || 0); kat[g.kategori] = (kat[g.kategori] || 0) + (+g.tutar || 0); });
  rows($("gkisi"), kisi, ""); rows($("gkat"), kat, "cat");
  const ortakTop = ORTAK.reduce((s, k) => s + (kisi[k] || 0), 0), pay = ortakTop / 3;
  $("gpay").textContent = ortakTop ? ("Eşit paylaşımda kişi başı " + TL(pay) + " · " + ORTAK.map(k => { const d = (kisi[k] || 0) - pay; return k + " " + (Math.abs(d) < 0.01 ? "eşit" : (d > 0 ? "+" : "−") + TL(Math.abs(d))); }).join(" · ")) : "";
  const tb = $("gtable");
  tb.innerHTML = giderler.map(g => `<tr data-id="${esc(g.id)}"><td style="white-space:nowrap">${esc(new Date(g.tarih + "T12:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }))}</td><td>${esc(g.aciklama)}</td><td><span class="chip">${esc(g.kategori)}</span></td><td>${esc(g.odeyen)}</td><td class="num2">${TL(g.tutar)}</td><td><button class="del" type="button">Sil</button></td></tr>`).join("") || '<tr><td colspan="6" class="muted">Henüz gider yok. İlk harcamayı yukarıdan ekle.</td></tr>';
  tb.querySelectorAll(".del").forEach(b => b.onclick = () => {
    if (!b.classList.contains("sure")) { b.classList.add("sure"); b.textContent = "Tekrar tıkla"; setTimeout(() => { b.classList.remove("sure"); b.textContent = "Sil"; }, 4000); return; }
    deleteDoc(doc(db, "giderler", b.closest("tr").dataset.id)).then(() => flash("Silindi")).catch(() => flash("Silinemedi"));
  });
}
$("g-kat").innerHTML = KAT.map(k => `<option>${k}</option>`).join("");
$("g-odeyen").innerHTML = ODEYEN.map(k => `<option>${k}</option>`).join("");
$("g-tarih").value = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
$("gform").onsubmit = e => {
  e.preventDefault(); const t = parseFloat(String($("g-tutar").value).replace(",", ".")); if (!(t > 0)) { flash("Tutarı yaz"); return; }
  addDoc(collection(db, "giderler"), { tarih: $("g-tarih").value, aciklama: $("g-acik").value.trim(), kategori: $("g-kat").value, tutar: Math.round(t * 100) / 100, odeyen: $("g-odeyen").value, ekleyen: MYNAME, ts: Date.now() })
    .then(() => { $("g-acik").value = ""; $("g-tutar").value = ""; flash("Gider kaydedildi"); }).catch(() => flash("Kaydedilemedi"));
};
$("addform").onsubmit = e => {
  e.preventDefault(); const b = $("add-t").value.trim(); if (!b) return;
  panel.gorevler.push({ id: "g" + Date.now(), baslik: b, aciklama: $("add-d").value.trim(), durum: "acik", not: "", tarih: $("add-tarih").value || "" }); $("add-t").value = ""; $("add-d").value = ""; $("add-tarih").value = ""; savePanel();
};
$("logform").onsubmit = e => {
  e.preventDefault(); const v = $("logtext").value.trim(); if (!v) return;
  addDoc(collection(db, "gunluk"), { metin: v, yazan: MYNAME, ts: Date.now() }).then(() => { $("logtext").value = ""; flash("Eklendi"); }).catch(() => flash("Eklenemedi"));
};

/* ---------- bütçe & sermaye ---------- */
let BT = (() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; })();
const ay = () => BT.y + "-" + String(BT.m + 1).padStart(2, "0");
function renderButce() {
  const smTop = sermaye.reduce((t, x) => t + (+x.tutar || 0), 0), gTop = giderler.reduce((t, g) => t + (+g.tutar || 0), 0);
  const kasaG = giderler.filter(g => g.odeyen === "Ortak kasa").reduce((t, g) => t + (+g.tutar || 0), 0);
  const ayG = giderler.filter(g => (g.tarih || "").startsWith(ay())).reduce((t, g) => t + (+g.tutar || 0), 0);
  const plan = butce[ay()] || {}, planTop = Object.values(plan).reduce((t, v) => t + (+v || 0), 0);
  $("kasa").innerHTML = [["Toplam sermaye", TL(smTop)], ["Kasada kalan", TL(smTop - kasaG)], ["Toplam harcama", TL(gTop)], ["Bu ay bütçe / harcanan", TL(planTop) + " / " + TL(ayG)]]
    .map(([b, v], i) => `<div class="fact${i === 1 && smTop - kasaG < 0 ? " pend" : ""}"><b>${b}</b><span>${v}</span></div>`).join("");
  const kisi = {}; ORTAK.forEach(k => kisi[k] = 0); sermaye.forEach(x => kisi[x.kisi] = (kisi[x.kisi] || 0) + (+x.tutar || 0));
  const cep = {}; giderler.filter(g => ORTAK.includes(g.odeyen)).forEach(g => cep[g.odeyen] = (cep[g.odeyen] || 0) + (+g.tutar || 0));
  const mx = Math.max(1, ...ORTAK.map(k => kisi[k] + (cep[k] || 0)));
  $("sm-kisi").innerHTML = ORTAK.map(k => { const t = kisi[k] + (cep[k] || 0); return `<div class="row"><span>${k}</span><div class="bar"><i style="width:${100 * t / mx}%"></i></div><span class="amt">${TL(t)}</span></div>`; }).join("");
  const tumu = ORTAK.reduce((t, k) => t + kisi[k] + (cep[k] || 0), 0);
  $("sm-not").textContent = tumu ? "Toplam katkı = sermaye + kendi cebinden ödediği giderler. Paylar: " + ORTAK.map(k => k + " %" + Math.round(100 * (kisi[k] + (cep[k] || 0)) / tumu)).join(" · ") : "Henüz sermaye kaydı yok.";
  $("sm-table").innerHTML = sermaye.map(x => `<tr data-id="${esc(x.id)}"><td style="white-space:nowrap">${esc(new Date(x.tarih + "T12:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }))}</td><td>${esc(x.kisi)}</td><td>${esc(x.not || "")}</td><td class="num2">${TL(x.tutar)}</td><td><button class="del" type="button">Sil</button></td></tr>`).join("") || '<tr><td colspan="5" class="muted">Henüz sermaye kaydı yok.</td></tr>';
  $("sm-table").querySelectorAll(".del").forEach(b => b.onclick = () => {
    if (!b.classList.contains("sure")) { b.classList.add("sure"); b.textContent = "Tekrar tıkla"; setTimeout(() => { b.classList.remove("sure"); b.textContent = "Sil"; }, 4000); return; }
    deleteDoc(doc(db, "sermaye", b.closest("tr").dataset.id)).then(() => flash("Silindi")).catch(() => flash("Silinemedi"));
  });
  $("bt-title").textContent = AYLAR[BT.m] + " " + BT.y;
  const ger = {}; giderler.filter(g => (g.tarih || "").startsWith(ay())).forEach(g => ger[g.kategori] = (ger[g.kategori] || 0) + (+g.tutar || 0));
  const focused = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.k;
  let pT = 0, gT = 0;
  $("bt-table").innerHTML = KAT.map(k => { const p = +plan[k] || 0, g = ger[k] || 0; pT += p; gT += g; const pct = p ? Math.min(100, 100 * g / p) : (g ? 100 : 0);
    return `<tr><td>${k}</td><td class="num2"><input class="bt-in" type="number" min="0" step="1" data-k="${k}" value="${p || ""}" placeholder="0"></td><td class="num2">${TL(g)}</td><td class="num2${g > p && p ? " over" : ""}">${p ? TL(p - g) : "—"}</td><td><div class="bar"><i style="width:${pct}%;${g > p ? "background:var(--bad)" : ""}"></i></div></td></tr>`; }).join("")
    + `<tr><td><b>Toplam</b></td><td class="num2"><b>${TL(pT)}</b></td><td class="num2"><b>${TL(gT)}</b></td><td class="num2${gT > pT && pT ? " over" : ""}"><b>${pT ? TL(pT - gT) : "—"}</b></td><td></td></tr>`;
  $("bt-table").querySelectorAll(".bt-in").forEach(inp => inp.onchange = () => {
    const v = Math.max(0, +inp.value || 0), cur = Object.assign({}, butce[ay()] || {}); cur[inp.dataset.k] = v;
    setDoc(doc(db, "butce", ay()), cur).then(() => flash("Bütçe kaydedildi")).catch(() => flash("Kaydedilemedi"));
  });
  if (focused) { const f = $("bt-table").querySelector(`[data-k="${focused}"]`); if (f) f.focus(); }
}
$("bt-prev").onclick = () => { BT.m--; if (BT.m < 0) { BT.m = 11; BT.y--; } renderButce(); };
$("bt-next").onclick = () => { BT.m++; if (BT.m > 11) { BT.m = 0; BT.y++; } renderButce(); };
$("sm-kim").innerHTML = ORTAK.map(k => `<option>${k}</option>`).join("");
$("sm-tarih").value = iso(new Date());
$("smform").onsubmit = e => {
  e.preventDefault(); const t = parseFloat(String($("sm-tutar").value).replace(",", ".")); if (!(t > 0)) { flash("Tutarı yaz"); return; }
  addDoc(collection(db, "sermaye"), { tarih: $("sm-tarih").value, kisi: $("sm-kim").value, tutar: Math.round(t * 100) / 100, not: $("sm-acik").value.trim(), ekleyen: MYNAME, ts: Date.now() })
    .then(() => { $("sm-tutar").value = ""; $("sm-acik").value = ""; flash("Sermaye kaydedildi"); }).catch(() => flash("Kaydedilemedi"));
};

/* ---------- ekip ---------- */
const ini = s => (s || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toLocaleUpperCase("tr-TR");
function renderEkip() {
  const el = $("team"); if (!ekip.length) { el.innerHTML = '<div class="empty">Henüz ekip bilgisi yok.</div>'; return; }
  if (el.contains(document.activeElement) && document.activeElement.tagName === "TEXTAREA") return;
  el.innerHTML = ekip.map(m => `<article class="member" data-id="${esc(m.id)}">
    <div class="m-top"><div class="avatar">${m.foto ? `<img src="${esc(m.foto)}" alt="${esc(m.ad)}">` : esc(ini(m.ad))}<label>${m.foto ? "Değiştir" : "Fotoğraf ekle"}<input type="file" accept="image/*" class="m-foto"></label></div>
      <div style="min-width:0"><div class="m-name">${esc(m.ad)}</div><span class="badge">${esc(m.unvan || "Kurucu Ortak / Co-founder")}</span></div></div>
    ${EDIT === m.id ? `<form class="m-form"><input class="m-rolin" value="${esc(m.rol || "")}" placeholder="Rol (ör. İçerik & Strateji)"><textarea class="m-sorin" placeholder="Her satıra bir sorumluluk">${esc((m.sorumluluklar || []).join("\n"))}</textarea><div style="display:flex;gap:8px"><button class="btn">Kaydet</button><button type="button" class="m-edit m-cancel">Vazgeç</button></div></form>`
      : `<div class="m-rol">${esc(m.rol || "")}</div><ul class="m-list">${(m.sorumluluklar || []).map(s => `<li>${esc(s)}</li>`).join("")}</ul><button type="button" class="m-edit">Rol ve sorumlulukları düzenle</button>`}
  </article>`).join("");
  el.querySelectorAll(".member").forEach(c => {
    const id = c.dataset.id, m = ekip.find(x => x.id === id);
    const ed = c.querySelector(".m-edit:not(.m-cancel)"); if (ed) ed.onclick = () => { EDIT = id; renderEkip(); };
    const cn = c.querySelector(".m-cancel"); if (cn) cn.onclick = () => { EDIT = null; renderEkip(); };
    const f = c.querySelector(".m-form"); if (f) f.onsubmit = e => { e.preventDefault(); const rol = c.querySelector(".m-rolin").value.trim(), sor = c.querySelector(".m-sorin").value.split("\n").map(s => s.trim()).filter(Boolean);
      EDIT = null; setDoc(doc(db, "ekip", id), { rol, sorumluluklar: sor }, { merge: true }).then(() => flash("Kaydedildi")).catch(() => flash("Kaydedilemedi")); };
    c.querySelector(".m-foto").onchange = async ev => {
      const file = ev.target.files[0]; if (!file) return; flash("Fotoğraf hazırlanıyor…");
      try { const url = await kucult(file, 320); await setDoc(doc(db, "ekip", id), { foto: url }, { merge: true }); flash("Fotoğraf kaydedildi"); } catch (e) { flash("Fotoğraf yüklenemedi"); }
    };
  });
}
function kucult(file, S) { return new Promise((res, rej) => { const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); c.width = c.height = S; const k = Math.min(img.width, img.height), sx = (img.width - k) / 2, sy = (img.height - k) / 2; c.getContext("2d").drawImage(img, sx, sy, k, k, 0, 0, S, S); URL.revokeObjectURL(img.src); res(c.toDataURL("image/jpeg", .82)); }; img.onerror = rej; img.src = URL.createObjectURL(file); }); }
window.juvemiEkipKur = async L => { if (!ME) throw new Error("önce giriş yap"); const b = writeBatch(db); L.forEach(x => b.set(doc(db, "ekip", x.id), x.data, { merge: true })); await b.commit(); return "tamam"; };

/* ---------- ayarlar (sadece mustafa) ---------- */
const KOL = [["ortak", "Özet ve netleşenler"], ["moduller", "Şirket alanları"], ["giderler", "Giderler"], ["sermaye", "Sermaye"], ["butce", "Aylık bütçe"], ["gunluk", "Ekip günlüğü"], ["mesajlar", "Sohbet mesajları"], ["etkinlikler", "Takvim etkinlikleri"], ["ekip", "Ekip profilleri (fotoğraflar)"], ["toplantilar", "Toplantı kayıtları"], ["yolharitasi", "Yol haritası"], ["haftalar", "Haftalık klasörler"], ["durum", "Çevrimiçi durumu"], ["geribildirim", "Geri bildirimler"]];
const GIB = 1024 ** 3;
const boyutYaz = b => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(2) + " MB";
const dokBoyut = (col, id, data) => new TextEncoder().encode(JSON.stringify(data)).length + col.length + id.length + 48;
async function hesapla() {
  ST_YUK = true; $("st-sub").textContent = "Hesaplanıyor…";
  try {
    const sat = []; let top = 0, adet = 0;
    for (const [c, ad] of KOL) { const s = await getDocs(collection(db, c)); let b = 0; s.docs.forEach(d => b += dokBoyut(c, d.id, d.data())); sat.push([ad, s.size, b]); top += b; adet += s.size; }
    const me = await getDoc(doc(db, "kullanicilar", ME)); const mb = me.exists() ? dokBoyut("kullanicilar", ME, me.data()) : 0;
    sat.push(["Kişisel görev listeleri (3 kişi, tahmini)", 3, mb * 3]); top += mb * 3; adet += 3;
    ST_SON = { top, adet, pct: 100 * top / GIB, sat, zaman: new Date() };
  } catch (e) { $("st-sub").textContent = "Hesaplanamadı: " + (e.code || e.message); }
  ST_YUK = false; renderAyar();
}
function renderAyar() {
  if (!ST_SON) return; const S = ST_SON, mx = Math.max(1, ...S.sat.map(x => x[2]));
  $("st-used").textContent = boyutYaz(S.top) + " / 1 GiB";
  $("st-sub").textContent = "%" + S.pct.toFixed(4) + " kullanıldı · " + S.adet + " kayıt · " + S.zaman.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) + " itibarıyla";
  $("st-fill").style.width = Math.max(.4, S.pct) + "%";
  $("st-table").innerHTML = S.sat.sort((a, b) => b[2] - a[2]).map(([ad, n, b]) => `<tr><td>${esc(ad)}</td><td class="num2">${n}</td><td class="num2">${boyutYaz(b)}</td><td><div class="st-mini"><i style="width:${100 * b / mx}%"></i></div></td></tr>`).join("");
  const yil = S.top > 0 ? "Bu hızla 1 GiB'a ulaşmak çok uzun sürer; fotoğraflar en büyük kalem." : "";
  $("st-diger").innerHTML = [["Günlük okuma", "50.000 / gün"], ["Günlük yazma", "20.000 / gün"], ["Giriş (Authentication)", "Ücretsiz, sınırsız e-posta/şifre"], ["Yayın (GitHub Pages)", "1 GB site · 100 GB/ay trafik"], ["Drive", "Kişisel Google hesabı kotası"], ["Durum", yil || "—"]]
    .map(([b, v]) => `<div class="fact"><b>${b}</b><span>${esc(v)}</span></div>`).join("");
}
$("st-yenile").onclick = () => { ST_SON = null; hesapla(); };

/* ---------- haftalık yükleme ---------- */
function buHafta() { const t = bugun(); return haftalar.find(w => w.baslangic <= t && t <= w.bitis) || haftalar[haftalar.length - 1]; }
function renderUpl() {
  const w = buHafta(), url = w && w.kisi && lnk(w.kisi[KADI]);
  const html = w && url ? `<div class="ic">${svg("upload", 24)}</div><div class="tx"><b>Haftalık üretimini yükle · ${esc(w.ad)}</b><span>Dosyalarını Drive'daki kendi klasörüne bırak. Hafta sonunda Claude inceleyip değerlendirmeyi Toplantılar'a ekler.</span></div><a class="btn" href="${esc(url)}" target="_blank" rel="noopener" style="text-decoration:none">Klasörümü aç ↗</a>` : "";
  if ($("upl").dataset.h !== html) { $("upl").innerHTML = html; $("upl").dataset.h = html; }
  const y = $("tp-yukle"); if (y) { y.href = url || "#"; y.style.display = url ? "" : "none"; }
}

/* ---------- yol haritası ---------- */
const FAZLAR = [["f1", "Faz 1 · Dijital başlangıç", "Ekim 2026 – Ocak 2027"], ["f2", "Faz 2 · Aylık abonelik kutusu", "Şubat – Haziran 2027"], ["f3", "Faz 3 · Büyüme", "Temmuz 2027 ve sonrası"]];
const YDL = { acik: "Planlandı", devam: "Sürüyor", bitti: "Tamamlandı" };
$("yf-faz").innerHTML = FAZLAR.map(f => `<option value="${f[0]}">${f[1]}</option>`).join("");
/* ---------- geri bildirim ---------- */
var geri = [], GTUR = "hepsi", GDUR = "acik", GACIK = null;
const GT = { talep: ["Talep", "🙋"], oneri: ["Öneri", "💡"], hata: ["Hata", "🐞"], diger: ["Diğer", "💬"] };
const GD = { yeni: "Yeni", inceleniyor: "İnceleniyor", yapiliyor: "Yapılıyor", tamam: "Tamamlandı", red: "Yapılmayacak" };
const GDS = ["yeni", "inceleniyor", "yapiliyor", "tamam", "red"];
const YON = () => KADI === "mustafa";
function renderGeri() {
  const say = t => geri.filter(x => t === "hepsi" || x.tur === t).length;
  $("g-sekme").innerHTML = [["hepsi", "Tümü", "📋"]].concat(Object.entries(GT).map(([k, v]) => [k, { talep: "Talepler", oneri: "Öneriler", hata: "Hatalar", diger: "Diğer" }[k], v[1]])).map(([k, ad, e]) => `<button type="button" data-t="${k}" class="${GTUR === k ? "on" : ""}">${e} ${ad}<span>${say(k)}</span></button>`).join("");
  $("g-sekme").querySelectorAll("button").forEach(b => b.onclick = () => { GTUR = b.dataset.t; renderGeri(); });
  $("g-filtre").querySelectorAll("button").forEach(b => { b.classList.toggle("on", b.dataset.d === GDUR); b.onclick = () => { GDUR = b.dataset.d; renderGeri(); }; });
  let L = geri.filter(x => GTUR === "hepsi" || x.tur === GTUR);
  if (GDUR === "acik") L = L.filter(x => !["tamam", "red"].includes(x.durum || "yeni")); else if (GDUR === "kapali") L = L.filter(x => ["tamam", "red"].includes(x.durum));
  else if (GDUR === "benim") L = L.filter(x => x.kadi === KADI);
  L.sort((p, q) => (q.oy || []).length - (p.oy || []).length || q.ts - p.ts);
  const el = $("g-liste");
  if (!L.length) { el.innerHTML = `<div class="empty">Burada kayıt yok. Yukarıdan yeni bir ${GTUR === "hepsi" ? "talep ya da öneri" : GT[GTUR][0].toLowerCase()} yaz.</div>`; return; }
  el.innerHTML = L.map(x => { const d = x.durum || "yeni", oy = x.oy || [], ben = oy.includes(KADI), ac = GACIK === x.id;
    return `<article class="gk ${ac ? "ac" : ""}" data-id="${esc(x.id)}">
    <button type="button" class="g-oy ${ben ? "on" : ""}" title="Ben de istiyorum">▲<b>${oy.length}</b></button>
    <div class="g-ic"><div class="g-ust"><span class="g-tur g-${esc(x.tur)}">${GT[x.tur] ? GT[x.tur][1] + " " + GT[x.tur][0] : ""}</span>${x.oncelik === "yuksek" ? '<span class="g-acil">Acil</span>' : ""}<span class="g-dur d-${d}">${GD[d]}</span></div>
    <div class="g-bas">${esc(x.baslik)}</div>${x.aciklama ? `<div class="g-acik">${esc(x.aciklama).replace(/\n/g, "<br>")}</div>` : ""}
    <div class="g-alt">${esc(x.ad || x.kadi)} · ${new Date(x.ts).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}${(x.yorumlar || []).length ? ` · 💬 ${x.yorumlar.length}` : ""}</div>
    ${x.yanit ? `<div class="g-yanit"><b>Mustafa'nın yanıtı</b>${esc(x.yanit).replace(/\n/g, "<br>")}</div>` : ""}
    ${ac ? `<div class="g-detay">${(x.yorumlar || []).map(y => `<div class="g-yorum"><b>${esc(y.ad)}</b> ${esc(y.metin)}<span>${new Date(y.ts).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>`).join("")}
      <form class="g-yf"><input placeholder="Yorum yaz…" maxlength="500"><button class="btn">Gönder</button></form>
      ${YON() ? `<div class="g-yon"><label>Durum<select class="g-ds">${GDS.map(k => `<option value="${k}" ${k === d ? "selected" : ""}>${GD[k]}</option>`).join("")}</select></label><label style="flex:1">Yanıtın<textarea class="g-yt" rows="2" placeholder="Ne yaptığını / ne zaman yapılacağını yaz">${esc(x.yanit || "")}</textarea></label><button type="button" class="btn g-ykay">Kaydet</button></div>` : ""}
      ${YON() || x.kadi === KADI ? `<button type="button" class="del g-sil">Sil</button>` : ""}</div>` : ""}
    </div></article>`; }).join("");
  el.querySelectorAll(".gk").forEach(k => { const id = k.dataset.id, x = geri.find(z => z.id === id);
    k.querySelector(".g-ic").onclick = e => { if (e.target.closest("form,select,textarea,button,input")) return; GACIK = GACIK === id ? null : id; renderGeri(); };
    k.querySelector(".g-oy").onclick = () => { const o = new Set(x.oy || []); o.has(KADI) ? o.delete(KADI) : o.add(KADI); setDoc(doc(db, "geribildirim", id), { oy: [...o] }, { merge: true }).catch(() => flash("Kaydedilemedi")); };
    const yf = k.querySelector(".g-yf"); if (yf) yf.onsubmit = e => { e.preventDefault(); const v = yf.querySelector("input").value.trim(); if (!v) return; setDoc(doc(db, "geribildirim", id), { yorumlar: (x.yorumlar || []).concat({ kadi: KADI, ad: MYNAME, metin: v, ts: Date.now() }) }, { merge: true }).catch(() => flash("Gönderilemedi")); };
    const yk = k.querySelector(".g-ykay"); if (yk) yk.onclick = () => setDoc(doc(db, "geribildirim", id), { durum: k.querySelector(".g-ds").value, yanit: k.querySelector(".g-yt").value.trim(), guncel: Date.now() }, { merge: true }).then(() => flash("Kaydedildi")).catch(() => flash("Kaydedilemedi"));
    const sl = k.querySelector(".g-sil"); if (sl) sl.onclick = () => { if (!sl.classList.contains("sure")) { sl.classList.add("sure"); sl.textContent = "Emin misin? Tekrar tıkla"; return; } deleteDoc(doc(db, "geribildirim", id)).then(() => flash("Silindi")); };
  });
}
$("g-yeni").onclick = () => { $("g-form").hidden = !$("g-form").hidden; if (!$("g-form").hidden) { if (GTUR !== "hepsi") $("gf-tur").value = GTUR; $("gf-bas").focus(); } };
$("gf-iptal").onclick = () => { $("g-form").hidden = true; };
$("g-form").onsubmit = e => { e.preventDefault(); const b = $("gf-bas").value.trim(); if (!b) return;
  addDoc(collection(db, "geribildirim"), { tur: $("gf-tur").value, oncelik: $("gf-onc").value, baslik: b, aciklama: $("gf-acik").value.trim(), kadi: KADI, ad: MYNAME, ts: Date.now(), durum: "yeni", oy: [KADI], yorumlar: [] })
    .then(() => { $("g-form").reset(); $("g-form").hidden = true; flash("Gönderildi"); }).catch(() => flash("Gönderilemedi")); };
let YKIM = (() => { try { return localStorage.getItem("juvemi-ykim") || "hepsi"; } catch (e) { return "hepsi"; } })();
const KADAD = { mustafa: "Mustafa", fatmanur: "Fatma Nur", rumeysa: "Rumeysa" };
function renderYol() {
  if ($("yh-form").contains(document.activeElement)) return;
  const kisi = YKIM === "benim" ? KADAD[KADI] : YKIM === "hepsi" ? null : YKIM, uy = x => !kisi || (x.sorumlu || "Hepsi") === kisi || (x.sorumlu || "Hepsi") === "Hepsi";
  $("yh-filtre").innerHTML = [["hepsi", "Tüm ekip"], ["benim", "Benim yol haritam"], ["Mustafa", "Mustafa"], ["Fatma Nur", "Fatma Nur"], ["Rumeysa", "Rumeysa"]].map(([k, ad]) => `<button type="button" data-k="${esc(k)}" class="${YKIM === k ? "on" : ""}">${esc(ad)}<span>${yol.filter(x => { const kk = k === "benim" ? KADAD[KADI] : k === "hepsi" ? null : k; return !kk || (x.sorumlu || "Hepsi") === kk || (x.sorumlu || "Hepsi") === "Hepsi"; }).length}</span></button>`).join("");
  $("yh-filtre").querySelectorAll("button").forEach(b => b.onclick = () => { YKIM = b.dataset.k; try { localStorage.setItem("juvemi-ykim", YKIM); } catch (e) { } renderYol(); });
  const el = $("yh"); if (!yol.filter(uy).length) { el.innerHTML = '<div class="empty">' + (yol.length ? "Bu filtrede hedef yok." : "Henüz hedef yok.") + '</div>'; return; }
  el.innerHTML = FAZLAR.map(([id, ad, ar]) => { const L = yol.filter(x => x.faz === id && uy(x)).sort((a, b) => (a.tarih || "9").localeCompare(b.tarih || "9") || (a.sira || 0) - (b.sira || 0)); if (!L.length) return "";
    const b = L.filter(x => x.durum === "bitti").length;
    return `<div class="faz"><div class="faz-h"><b>${esc(ad)}</b><span>${esc(ar)} · ${b}/${L.length} tamam</span></div><div class="faz-bar"><i style="width:${100 * b / L.length}%"></i></div>
      <div class="yh-list">${L.map(x => `<div class="yi ${esc(x.durum || "acik")}" data-id="${esc(x.id)}"><b>${esc(x.baslik)}</b><button type="button" class="pill" data-s="${esc(x.durum || "acik")}">${YDL[x.durum || "acik"]}</button>${x.aciklama ? `<p>${esc(x.aciklama)}</p>` : ""}<div class="meta">${x.sorumlu ? `<span>👤 ${esc(x.sorumlu)}</span>` : ""}${x.tarih ? `<span>🎯 ${esc(new Date(x.tarih + "T12:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }))}</span>` : ""}</div></div>`).join("")}</div></div>`; }).join("");
  el.querySelectorAll(".yi").forEach(c => { const x = yol.find(y => y.id === c.dataset.id);
    c.querySelector(".pill").onclick = ev => { ev.stopPropagation(); const n = ST[(ST.indexOf(x.durum || "acik") + 1) % 3]; setDoc(doc(db, "yolharitasi", x.id), { durum: n }, { merge: true }).catch(() => flash("Kaydedilemedi")); };
    c.onclick = () => yhForm(x); });
}
function yhForm(x) { YHEDIT = x ? x.id : null; $("yf-faz").value = x ? x.faz : "f1"; $("yf-kim").value = x ? x.sorumlu || "Hepsi" : "Hepsi"; $("yf-tarih").value = x ? x.tarih || "" : ""; $("yf-durum").value = x ? x.durum || "acik" : "acik";
  $("yf-baslik").value = x ? x.baslik : ""; $("yf-acik").value = x ? x.aciklama || "" : ""; $("yf-sil").hidden = !x; $("yh-form").hidden = false; $("yf-baslik").focus(); scrollTo(0, 0); }
$("yh-yeni").onclick = () => yhForm(null);
$("yf-iptal").onclick = () => { $("yh-form").hidden = true; YHEDIT = null; renderYol(); };
$("yf-sil").onclick = () => { const s = $("yf-sil"); if (!s.classList.contains("sure")) { s.classList.add("sure"); s.textContent = "Silmek için tekrar tıkla"; setTimeout(() => { s.classList.remove("sure"); s.textContent = "Sil"; }, 4000); return; }
  deleteDoc(doc(db, "yolharitasi", YHEDIT)).then(() => { $("yh-form").hidden = true; YHEDIT = null; flash("Silindi"); }).catch(() => flash("Silinemedi")); };
$("yh-form").onsubmit = e => { e.preventDefault(); const d = { faz: $("yf-faz").value, sorumlu: $("yf-kim").value, tarih: $("yf-tarih").value, durum: $("yf-durum").value, baslik: $("yf-baslik").value.trim(), aciklama: $("yf-acik").value.trim(), duzenleyen: MYNAME, ts: Date.now() };
  (YHEDIT ? setDoc(doc(db, "yolharitasi", YHEDIT), d, { merge: true }) : addDoc(collection(db, "yolharitasi"), d)).then(() => { $("yh-form").hidden = true; YHEDIT = null; flash("Kaydedildi"); renderYol(); }).catch(() => flash("Kaydedilemedi")); };

/* ---------- toplantılar ---------- */
const ORTAKLAR = [["mustafa", "Mustafa"], ["fatmanur", "Fatma Nur"], ["rumeysa", "Rumeysa"]];
const lnk = u => /^https?:\/\//.test(u || "") ? u : "";
/* ---------- kurumsal rapor ---------- */
let RPID = null;
const LOGO2 = 'Juvé<span class="m">m</span><span class="i">i</span>';
function yayinla(id) { setDoc(doc(db, "toplantilar", id), { taslak: false, yayin: Date.now() }, { merge: true }).then(() => { flash("Yayınlandı, ekip görebilir"); $("rp-yay").hidden = true; $("rp-dur").textContent = ""; }).catch(() => flash("Kaydedilemedi")); }
function raporAc(id) {
  const t = toplantilar.find(x => x.id === id); if (!t || !t.rapor) return flash("Bu kayıtta rapor yok");
  RPID = id; const R = t.rapor, L = x => (x || []).map(s => `<li>${esc(s)}</li>`).join("");
  const hd = `<img class="wm" src="mi.png" alt=""><div class="kenar">JUVÉMİ · little things for growing minds</div><div class="hd"><img class="lg2" src="logo-j.png" alt="Juvémi"><span>JUVÉMİ · KURUMSAL BELGE · ${esc(R.no || "")}</span><span>${esc(R.tarih || "")}</span></div>`;
  let sayfa = 0; const ft = () => `<div class="ft"><span>Juvémi · ${esc(R.no || "")} · ${esc(R.baslik || "")}</span><span>${++sayfa}</span></div>`;
  const kapak = `<section class="rpg kapak"><div class="c" style="width:150mm;height:150mm;background:var(--red);right:-42mm;top:-75mm"></div><div class="c" style="width:82mm;height:82mm;background:var(--yel);right:32mm;top:73mm"></div><div class="c" style="width:60mm;height:60mm;background:var(--pink);left:-17mm;bottom:-23mm"></div><div class="c" style="width:23mm;height:23mm;background:#e8e2da;right:14mm;bottom:30mm"></div>
    <div class="lgk"><img src="logo-j-acik.png" alt="Juvémi"><small>little things for growing minds</small></div>
    <div class="ct"><span class="pill">${esc(R.etiket || "KURUMSAL RAPOR")}</span><h1>${esc(R.baslik || "")}</h1><div class="sub">${esc(R.alt || "")}</div><div class="tags">${(R.etiketler || []).map(x => `<span>${esc(x)}</span>`).join("")}</div></div>
    <div class="cf"><span>Juvémi · Şirket içi · Gizli</span><span>Belge No: ${esc(R.no || "")}</span></div></section>`;
  const s1 = `<section class="rpg">${hd}<div class="meta"><div><span>Hazırlayan</span>${esc(R.hazirlayan || "")}</div><div><span>Dönem</span>${esc(R.donem || "")}</div><div><span>Kaynak</span>${esc(R.kaynak || "")}</div><div><span>Dağıtım</span>Kurucu ortaklar</div></div>
    <div class="ey">1 · Yönetici özeti</div><h2>Haftanın özeti</h2><p class="lead">${esc(R.ozet || "")}</p>
    <div class="stats">${(R.istat || []).map(x => { const v = Array.isArray(x) ? x[0] : x.v, l = Array.isArray(x) ? x[1] : x.l; return [v, l]; }).map(([v, l]) => `<div class="st"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join("")}</div>
    ${(R.kisiler || []).slice(0, 1).map((k, i) => kisiHTML(k, i + 2)).join("")}${ft()}</section>`;
  const s2 = `<section class="rpg">${hd}${(R.kisiler || []).slice(1).map((k, i) => kisiHTML(k, i + 3)).join("")}${ft()}</section>`;
  const n = (R.kisiler || []).length + 2;
  const s3 = `<section class="rpg">${hd}<div class="ey">${n} · Toplantı gündemi</div><h2>Karar önerileri ve aksiyonlar</h2>
    <h3>Karar önerileri</h3><table>${(R.kararlar || []).map((k, i) => `<tr><td>Karar ${i + 1}</td><td>${esc(k)}</td></tr>`).join("")}</table>
    <h3>Gelecek hafta aksiyonları</h3><div class="kisi" style="grid-template-columns:1fr 1fr 1fr">${(R.aksiyonlar || []).map(a => `<div class="card"><b class="t">${esc(a.kim)}</b><ul>${L(a.isler)}</ul></div>`).join("")}</div>
    <div class="sign"><div>Mustafa ALTINTOP<span>Onaylayan · Kurucu Ortak</span></div><div>Fatma Nur TAKIŞ ALTINTOP<span>Kurucu Ortak</span></div><div>Rumeysa TAKIŞ<span>Kurucu Ortak</span></div></div>
    <p style="font-size:7pt;color:var(--mut2);margin-top:4mm">Bu değerlendirme Drive'daki haftalık üretim dosyaları incelenerek Claude tarafından taslak olarak hazırlanmış ve Mustafa tarafından onaylanmıştır. Şirket içi kullanım içindir.</p>${ft()}</section>`;
  $("rp-sahne").innerHTML = kapak + s1 + s2 + s3;
  $("rp-bas").textContent = R.no + " · " + R.baslik; $("rp-yay").hidden = !(t.taslak && KADI === "mustafa"); $("rp-dur").textContent = t.taslak ? "Taslak — ekip henüz görmüyor" : "";
  $("rp-ov").hidden = false; document.body.style.overflow = "hidden";
}
function kisiHTML(k, no) { const L = x => (x || []).map(s => `<li>${esc(s)}</li>`).join("");
  return `<div class="ey">${no} · ${esc(k.rol || "")}</div><h3 style="margin-top:1mm;font-size:16pt">${esc(k.ad)}</h3>${k.not ? `<div class="note">${esc(k.not)}</div>` : ""}
  <div class="kisi"><div class="card"><b class="t">Ürettikleri</b><ul>${L(k.uretim)}</ul></div><div class="card"><b class="t">Değerlendirme</b><ul>${L(k.deg)}</ul></div></div>`; }
$("rp-kapat").onclick = () => { $("rp-ov").hidden = true; document.body.style.overflow = ""; };
$("rp-pdf").onclick = () => { const eski = document.title, t = toplantilar.find(x => x.id === RPID); if (t && t.rapor) document.title = "Juvemi-" + (t.rapor.no || "rapor"); print(); setTimeout(() => document.title = eski, 500); };
$("rp-yay").onclick = () => RPID && yayinla(RPID);
addEventListener("keydown", e => { if (e.key === "Escape" && !$("rp-ov").hidden) $("rp-kapat").click(); });
$("tp-rapor").onclick = () => { const r = toplantilar.filter(t => t.rapor && (!t.taslak || KADI === "mustafa")); if (!r.length) return flash(KADI === "mustafa" ? "Henüz rapor yok — Claude'a analiz ettir" : "Bu haftanın raporu henüz yayınlanmadı"); raporAc(r[0].id); };
$("tp-analiz").onclick = () => { setDoc(doc(db, "ortak", "analiz"), { istek: Date.now(), kadi: KADI, durum: "bekliyor" }, { merge: true }).catch(() => { });
  window.open("https://claude.ai/code/session_01PMgkMbSADMZTYNyGgZe3ov", "_blank", "noopener"); flash("İstek kaydedildi — Claude'a 'haftalık raporu hazırla' yaz"); };
function renderTp() {
  $("tp-analiz").hidden = KADI !== "mustafa";
  const dl = lnk(ozet && ozet.drive);
  $("tp-drive").href = dl || "#"; $("tp-drive").style.opacity = dl ? 1 : .5; $("tp-drive").onclick = e => { if (!dl) { e.preventDefault(); flash("Önce Drive linkini ekle"); } };
  $("tp-drivedurum").textContent = dl ? "Herkes tıklayıp ulaşabilir" : "Henüz link eklenmedi";
  if ($("tp-form").contains(document.activeElement)) return;
  const el = $("tp-list");
  if (!toplantilar.length) { el.innerHTML = '<div class="empty">Henüz toplantı kaydı yok. "+ Yeni toplantı kaydı" ile ilkini ekle.</div>'; return; }
  const TL2 = toplantilar.filter(t => !t.taslak || KADI === "mustafa");
  if (!TL2.length) { el.innerHTML = '<div class="empty">Henüz toplantı kaydı yok.</div>'; return; }
  el.innerHTML = TL2.map(t => { const d = new Date(t.tarih + "T12:00"), U = t.uretimler || {};
    return `<article class="tp${TPACIK === t.id ? " open" : ""}" data-id="${esc(t.id)}">
      <button type="button" class="tp-h"><span class="tp-date"><b>${d.getDate()}</b><span>${esc(AYLAR[d.getMonth()].slice(0, 3))}</span></span><span class="t"><b>${esc(t.baslik || "Toplantı")}${t.taslak ? '<span class="tp-taslak">Taslak · sadece sen</span>' : ""}</b><div>${esc((t.ozet || "").split("\n")[0])}</div></span><span class="ch">${svg("chev", 18)}</span></button>
      <div class="tp-b">
        ${t.ozet ? `<div><h3>Özet</h3><p>${esc(t.ozet)}</p></div>` : ""}
        <div><h3>Haftalık üretimler</h3><div class="tp-u">${ORTAKLAR.map(([k, ad]) => { const u = U[k] || {}, m = ekip.find(x => x.id === k) || { ad };
          return `<div class="c"><div class="hd"><span class="ou">${m.foto ? `<img src="${esc(m.foto)}" alt="">` : esc(ini(m.ad))}</span>${esc(ad)}</div>
            ${u.yapilan ? `<div><small>Üretti</small><p>${esc(u.yapilan)}</p></div>` : '<div class="muted">Kayıt yok</div>'}
            ${u.degerlendirme ? `<div><small>Değerlendirme</small><p>${esc(u.degerlendirme)}</p></div>` : ""}
            ${lnk(u.link) ? `<a href="${esc(u.link)}" target="_blank" rel="noopener">Dosyaları aç ↗</a>` : ""}</div>`; }).join("")}</div></div>
        ${(t.kararlar || []).length ? `<div><h3>Alınan kararlar</h3><ul class="tp-ul">${t.kararlar.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
        ${(t.aksiyonlar || []).length ? `<div><h3>Aksiyonlar</h3><ul class="tp-ul">${t.aksiyonlar.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
        <div class="tp-act">${t.rapor ? `<button type="button" class="btn tp-rp">📄 Raporu aç (PDF)</button>` : ""}${t.taslak && KADI === "mustafa" ? `<button type="button" class="btn dark tp-yay">Yayınla</button>` : ""}${lnk(t.drive) ? `<a class="lnk" href="${esc(t.drive)}" target="_blank" rel="noopener">Bu haftanın Drive klasörü ↗</a>` : ""}<button type="button" class="m-edit tp-duz">Düzenle</button><button type="button" class="del tp-sil">Sil</button><span class="muted" style="margin-left:auto;font-size:12px">${esc(t.ekleyen ? "Kaydeden: " + t.ekleyen : "")}</span></div>
      </div></article>`; }).join("");
  el.querySelectorAll(".tp").forEach(c => { const id = c.dataset.id;
    c.querySelector(".tp-h").onclick = () => { TPACIK = TPACIK === id ? null : id; renderTp(); };
    const rb = c.querySelector(".tp-rp"); if (rb) rb.onclick = () => raporAc(id);
    const yb = c.querySelector(".tp-yay"); if (yb) yb.onclick = () => yayinla(id);
    c.querySelector(".tp-duz").onclick = () => tpForm(toplantilar.find(x => x.id === id));
    const s = c.querySelector(".tp-sil"); s.onclick = () => { if (!s.classList.contains("sure")) { s.classList.add("sure"); s.textContent = "Silmek için tekrar tıkla"; setTimeout(() => { s.classList.remove("sure"); s.textContent = "Sil"; }, 4000); return; }
      deleteDoc(doc(db, "toplantilar", id)).then(() => flash("Silindi")).catch(() => flash("Silinemedi")); };
  });
}
function tpForm(t) {
  TPEDIT = t ? t.id : null; const U = (t && t.uretimler) || {};
  $("tf-tarih").value = t ? t.tarih : iso(new Date()); $("tf-baslik").value = t ? t.baslik || "" : ""; $("tf-drive").value = t ? t.drive || "" : "";
  $("tf-ozet").value = t ? t.ozet || "" : ""; $("tf-karar").value = t ? (t.kararlar || []).join("\n") : ""; $("tf-aksiyon").value = t ? (t.aksiyonlar || []).join("\n") : "";
  $("tf-kisiler").innerHTML = ORTAKLAR.map(([k, ad]) => { const u = U[k] || {}; return `<div class="tp-kisi" data-k="${k}"><h4>${ad}</h4><label>Bu hafta ne üretti<textarea rows="3" class="k-y">${esc(u.yapilan || "")}</textarea></label><label>Değerlendirme<textarea rows="3" class="k-d">${esc(u.degerlendirme || "")}</textarea></label><label>Dosya bağlantısı<input type="url" class="k-l" value="${esc(u.link || "")}" placeholder="https://drive.google.com/…"></label></div>`; }).join("");
  $("tp-form").hidden = false; $("tf-baslik").focus(); scrollTo(0, 0);
}
$("tp-yeni").onclick = () => tpForm(null);
$("tf-iptal").onclick = () => { $("tp-form").hidden = true; TPEDIT = null; renderTp(); };
$("tp-form").onsubmit = e => { e.preventDefault();
  const satir = id => $(id).value.split("\n").map(s => s.trim()).filter(Boolean), U = {};
  $("tf-kisiler").querySelectorAll(".tp-kisi").forEach(c => U[c.dataset.k] = { yapilan: c.querySelector(".k-y").value.trim(), degerlendirme: c.querySelector(".k-d").value.trim(), link: c.querySelector(".k-l").value.trim() });
  const d = { tarih: $("tf-tarih").value, baslik: $("tf-baslik").value.trim(), drive: $("tf-drive").value.trim(), ozet: $("tf-ozet").value.trim(), kararlar: satir("tf-karar"), aksiyonlar: satir("tf-aksiyon"), uretimler: U, ekleyen: MYNAME, ts: Date.now() };
  const p = TPEDIT ? setDoc(doc(db, "toplantilar", TPEDIT), d) : addDoc(collection(db, "toplantilar"), d);
  p.then(r => { TPACIK = TPEDIT || (r && r.id) || null; TPEDIT = null; $("tp-form").hidden = true; flash("Toplantı kaydedildi"); renderTp(); }).catch(() => flash("Kaydedilemedi"));
};
$("tp-drivedeg").onclick = () => { const f = $("tp-drivedeg"); if (f.dataset.on) return; f.dataset.on = 1;
  const box = document.createElement("form"); box.style.cssText = "display:flex;gap:8px;width:100%;margin-top:8px"; box.innerHTML = '<input type="url" placeholder="https://drive.google.com/drive/folders/…" style="flex:1" required><button class="btn">Kaydet</button>';
  box.querySelector("input").value = (ozet && ozet.drive) || ""; $("tp-drive").closest(".tp-top").appendChild(box); box.querySelector("input").focus();
  box.onsubmit = ev => { ev.preventDefault(); const v = box.querySelector("input").value.trim(); setDoc(doc(db, "ortak", "ozet"), { drive: v }, { merge: true }).then(() => { flash("Drive linki kaydedildi"); box.remove(); delete f.dataset.on; }).catch(() => flash("Kaydedilemedi")); };
};
window.juvemiToplu = async L => { if (!ME) throw new Error("önce giriş yap"); const b = writeBatch(db); L.forEach(([c, i, d]) => b.set(i ? doc(db, c, i) : doc(collection(db, c)), d, { merge: true })); await b.commit(); return "tamam " + L.length; };
window.juvemiYaz = async (col, id, data) => { if (!ME) throw new Error("önce giriş yap"); if (id) await setDoc(doc(db, col, id), data, { merge: true }); else await addDoc(collection(db, col), data); return "tamam"; };

/* ---------- sohbet (kanallar) ---------- */
let KANAL = (() => { try { return localStorage.getItem("juvemi-kanal") || "genel"; } catch (e) { return "genel"; } })(), kanallar = [];
const kanalOf = m => m.kanal || "genel";
const okKey = k => "juvemi-ok-" + KADI + "-" + k;
const sonOkunan = (k = KANAL) => { try { return +localStorage.getItem(okKey(k)) || (k === "genel" ? +localStorage.getItem("juvemi-okundu-" + KADI) || 0 : 0); } catch (e) { return 0; } };
function benimKanallar() { return kanallar.filter(k => !k.uyeler || !k.uyeler.length || k.uyeler.includes(KADI)); }
function okundu() { const L = mesajlar.filter(m => kanalOf(m) === KANAL), t = L.length ? L[L.length - 1].ts : 0; try { localStorage.setItem(okKey(KANAL), t); } catch (e) { } }
function okunmamis(k) { const ks = k ? [k] : benimKanallar().map(x => x.id); return mesajlar.filter(m => ks.includes(kanalOf(m)) && m.ts > sonOkunan(kanalOf(m)) && m.kadi !== KADI).length; }
function md(t) {
  const kod = []; let s = esc(t || "");
  s = s.replace(/```([\s\S]*?)```/g, (_, c) => { kod.push("<pre>" + c.replace(/^\n/, "") + "</pre>"); return "\u0000" + (kod.length - 1) + "\u0000"; });
  s = s.replace(/`([^`\n]+)`/g, (_, c) => { kod.push("<code>" + c + "</code>"); return "\u0000" + (kod.length - 1) + "\u0000"; });
  s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, txt, u) => { kod.push(`<a href="${u}" target="_blank" rel="noopener">${txt}</a>`); return "\u0000" + (kod.length - 1) + "\u0000"; });
  s = s.replace(/(https?:\/\/[^\s<]+)/g, u => `<a href="${u}" target="_blank" rel="noopener">${u.length > 60 ? u.slice(0, 57) + "…" : u}</a>`);
  s = s.replace(/\[([^\]\n]+)\]\((<a href="([^"]+)"[^>]*>[^<]*<\/a>)\)/g, (_, txt, a, u) => `<a href="${u}" target="_blank" rel="noopener">${txt}</a>`);
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>").replace(/(^|[^\w*])\*([^*\n]+)\*(?!\w)/g, "$1<b>$2</b>")
       .replace(/__([^_\n]+)__/g, "<u>$1</u>").replace(/(^|[^\w_])_([^_\n]+)_(?!\w)/g, "$1<i>$2</i>").replace(/~([^~\n]+)~/g, "<s>$1</s>")
       .replace(/(^|\s)@(Mustafa|Fatma Nur|Rumeysa|herkes)\b/g, '$1<span class="ment">@$2</span>');
  const L = s.split("\n"), out = []; let li = null;
  for (const l of L) { let m;
    if ((m = l.match(/^\s*[-•]\s+(.*)/))) { if (li !== "ul") { if (li) out.push(`</${li}>`); out.push("<ul>"); li = "ul"; } out.push("<li>" + m[1] + "</li>"); continue; }
    if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (li !== "ol") { if (li) out.push(`</${li}>`); out.push("<ol>"); li = "ol"; } out.push("<li>" + m[1] + "</li>"); continue; }
    if (li) { out.push(`</${li}>`); li = null; }
    if ((m = l.match(/^&gt;\s?(.*)/))) { out.push("<blockquote>" + m[1] + "</blockquote>"); continue; }
    out.push(l + "<br>");
  }
  if (li) out.push(`</${li}>`);
  return out.join("").replace(/<br>$/, "").replace(/\u0000(\d+)\u0000/g, (_, i) => kod[+i]).replace(/<\/pre><br>/g, "</pre>");
}
function linkle(t) { return esc(t).replace(/(https?:\/\/[^\s<]+)/g, u => `<a href="${u}" target="_blank" rel="noopener">${u.length > 60 ? u.slice(0, 57) + "…" : u}</a>`); }
function dosyaTur(u, ad) { const s = (ad || u).toLowerCase(); if (/docs\.google\.com\/document/.test(u)) return "DOC"; if (/spreadsheets/.test(u)) return "XLS"; if (/presentation/.test(u)) return "PPT"; if (/folders/.test(u)) return "KLS"; const m = s.match(/\.([a-z0-9]{2,4})(\?|$)/); return m ? m[1].toUpperCase() : "DOSYA"; }
let chatN = -1, chatK = "";
function renderChat() {
  const B = benimKanallar(); if (B.length && !B.some(k => k.id === KANAL)) KANAL = B[0].id;
  const K = kanallar.find(k => k.id === KANAL) || { id: "genel", ad: "genel" };
  $("klist").innerHTML = B.map(k => { const n = k.id === KANAL ? 0 : okunmamis(k.id); return `<button type="button" class="ki${n ? " un" : ""}" data-k="${esc(k.id)}" aria-current="${k.id === KANAL}"># ${esc(k.ad || k.id)}${n ? `<span class="nbadge">${n}</span>` : ""}</button>`; }).join("") || '<div class="muted" style="padding:6px">Kanal yok</div>';
  $("klist").querySelectorAll(".ki").forEach(b => b.onclick = () => { KANAL = b.dataset.k; try { localStorage.setItem("juvemi-kanal", KANAL); } catch (e) { } chatN = -1; renderTabs(); });
  $("k-ad").textContent = "# " + (K.ad || K.id); $("k-konu").textContent = K.konu || "";
  const uy = (K.uyeler && K.uyeler.length ? K.uyeler : ORTAKLAR.map(o => o[0]));
  $("k-uyeler").innerHTML = uy.map(id => { const m = ekip.find(x => x.id === id) || { ad: id }; return `<span class="ou" title="${esc(m.ad)}">${m.foto ? `<img src="${esc(m.foto)}" alt="">` : esc(ini(m.ad))}</span>`; }).join("");
  const kl = lnk(K.klasor); $("k-drive").href = kl || "#"; $("k-drive").style.display = kl ? "" : "none"; $("dosyaekle").style.display = kl ? "" : "none";
  const el = $("chatlist"), L = mesajlar.filter(m => kanalOf(m) === KANAL), alt = chatK !== KANAL || el.scrollHeight - el.scrollTop - el.clientHeight < 80 || chatN < 0;
  if (!L.length) { el.innerHTML = `<div class="empty"># ${esc(K.ad || K.id)} kanalında henüz mesaj yok. İlk mesajı sen yaz.</div>`; chatN = 0; chatK = KANAL; return; }
  let son = "";
  el.innerHTML = L.map(m => { const d = new Date(m.ts), g = d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }), kisi = ekip.find(x => x.id === m.kadi) || { ad: m.ad || m.kadi };
    const sep = g !== son ? `<div class="daysep">${esc(g)}</div>` : ""; son = g;
    const govde = m.tur === "dosya" ? `${m.html ? `<div class="md">${temiz(m.html)}</div>` : m.metin ? `<div class="md">${md(m.metin)}</div>` : ""}<a class="file" href="${esc(lnk(m.url) || "#")}" target="_blank" rel="noopener"><i>${esc(dosyaTur(m.url, m.dosyaAd))}</i><span style="min-width:0"><b>${esc(m.dosyaAd || "Drive dosyası")}</b><span>Google Drive'da aç</span></span></a>` : `<div class="md">${m.html ? temiz(m.html) : md(m.metin)}</div>`;
    return sep + `<div class="msg${m.kadi === KADI ? " me" : ""}"><span class="ou">${kisi.foto ? `<img src="${esc(kisi.foto)}" alt="">` : esc(ini(kisi.ad))}</span><div class="bub">${m.kadi === KADI ? "" : `<b class="nm">${esc((kisi.ad || "").split(" ")[0])}</b>`}${govde}<time>${d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</time></div></div>`; }).join("");
  if (alt || L.length !== chatN && L[L.length - 1].kadi === KADI) el.scrollTop = el.scrollHeight; chatN = L.length; chatK = KANAL;
}
/* --- zengin metin editörü --- */
const TA = () => $("chattext");
const IZIN = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, STRIKE: 1, DEL: 1, A: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1, CODE: 1, PRE: 1, BR: 1, DIV: 1, P: 1, SPAN: 1 };
function temiz(html) {
  const d = new DOMParser().parseFromString("<div>" + (html || "") + "</div>", "text/html"), kok = d.body.firstChild;
  (function gez(n) { [...n.childNodes].forEach(c => {
    if (c.nodeType === 3) return; if (c.nodeType !== 1 || !IZIN[c.tagName]) { if (c.nodeType === 1 && !/^(SCRIPT|STYLE|IFRAME|OBJECT)$/.test(c.tagName)) { gez(c); c.replaceWith(...c.childNodes); } else c.remove(); return; }
    const href = c.tagName === "A" ? c.getAttribute("href") : null, cls = c.getAttribute("class");
    [...c.attributes].forEach(at => c.removeAttribute(at.name));
    if (href && /^https?:\/\//i.test(href)) { c.setAttribute("href", href); c.setAttribute("target", "_blank"); c.setAttribute("rel", "noopener"); }
    if (c.tagName === "SPAN" && cls === "ment") c.setAttribute("class", "ment");
    gez(c); }); })(kok);
  return kok.innerHTML;
}
function otoLink(root) { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), L = []; while (w.nextNode()) { const t = w.currentNode; if (!t.parentElement.closest("a,code,pre") && /https?:\/\//.test(t.nodeValue)) L.push(t); }
  L.forEach(t => { const f = document.createDocumentFragment(); t.nodeValue.split(/(https?:\/\/[^\s]+)/g).forEach((p, k) => { if (k % 2) { const a = document.createElement("a"); a.href = p; a.textContent = p.length > 60 ? p.slice(0, 57) + "…" : p; f.appendChild(a); } else if (p) f.appendChild(document.createTextNode(p)); }); t.replaceWith(f); }); }
function editorIcerik() { const el = TA(), kopya = el.cloneNode(true); otoLink(kopya); const html = temiz(kopya.innerHTML).replace(/(<br>|<div><br><\/div>|\s|&nbsp;)+$/g, ""); return { html, metin: el.innerText.trim() }; }
function editorTemizle() { TA().innerHTML = ""; }
function gonder() { const { html, metin } = editorIcerik(); if (!metin) return; editorTemizle();
  addDoc(collection(db, "mesajlar"), { html, metin, kadi: KADI, ad: MYNAME, kanal: KANAL, ts: Date.now() }).catch(() => { flash("Gönderilemedi"); TA().innerHTML = html; }); }
$("chatform").onsubmit = e => { e.preventDefault(); gonder(); };
let SEC = null; const secKaydet = () => { const s = getSelection(); if (s.rangeCount && TA().contains(s.anchorNode)) SEC = s.getRangeAt(0).cloneRange(); };
const secYukle = () => { TA().focus(); if (SEC) { const s = getSelection(); s.removeAllRanges(); s.addRange(SEC); } };
document.addEventListener("selectionchange", () => { secKaydet(); durumGuncelle(); });
const icinde = sel => { const s = getSelection(); return s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement).closest(sel) && TA().contains(s.anchorNode); };
TA().addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { if (icinde("li,pre,blockquote")) return; e.preventDefault(); gonder(); return; }
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey) { const k = { b: "b", i: "i", u: "u", k: "link" }[e.key.toLowerCase()]; if (k) { e.preventDefault(); FMT[k](); } }
});
TA().addEventListener("paste", e => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData("text/plain"); document.execCommand("insertText", false, t); });
function kodSar() { const s = getSelection(); if (!s.rangeCount) return; const r = s.getRangeAt(0), metin = r.toString() || "kod"; const c = document.createElement("code"); c.textContent = metin; r.deleteContents(); r.insertNode(c); r.setStartAfter(c); r.collapse(true); s.removeAllRanges(); s.addRange(r); document.execCommand("insertText", false, "​"); }
const FMT = {
  b: () => document.execCommand("bold"), i: () => document.execCommand("italic"), u: () => document.execCommand("underline"), s: () => document.execCommand("strikeThrough"),
  ul: () => document.execCommand("insertUnorderedList"), ol: () => document.execCommand("insertOrderedList"),
  q: () => document.execCommand("formatBlock", false, icinde("blockquote") ? "div" : "blockquote"), pre: () => document.execCommand("formatBlock", false, icinde("pre") ? "div" : "pre"),
  code: () => kodSar(),
  link: () => { secKaydet(); $("linkbox").hidden = false; $("linkurl").value = ""; $("linkurl").focus(); }
};
$("linkok").onclick = () => { const u = $("linkurl").value.trim(); $("linkbox").hidden = true; if (!/^https?:\/\//.test(u)) { secYukle(); return; } secYukle();
  const s = getSelection(); if (s.isCollapsed) document.execCommand("insertHTML", false, `<a href="${esc(u)}">${esc(u)}</a>&nbsp;`); else document.execCommand("createLink", false, u); };
$("linkurl").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); $("linkok").click(); } if (e.key === "Escape") { $("linkbox").hidden = true; secYukle(); } });
$("linkiptal").onclick = () => { $("linkbox").hidden = true; secYukle(); };
$("cmptools").querySelectorAll("button").forEach(b => { b.onmousedown = e => e.preventDefault(); b.onclick = () => { if (!TA().contains(getSelection().anchorNode)) secYukle(); FMT[b.dataset.f](); durumGuncelle(); }; });
function durumGuncelle() { if (!TA().contains(getSelection().anchorNode)) return; const D = { b: "bold", i: "italic", u: "underline", s: "strikeThrough", ul: "insertUnorderedList", ol: "insertOrderedList" };
  $("cmptools").querySelectorAll("button").forEach(b => { const c = D[b.dataset.f]; let on = false; try { on = c ? document.queryCommandState(c) : b.dataset.f === "q" ? !!icinde("blockquote") : b.dataset.f === "pre" ? !!icinde("pre") : b.dataset.f === "code" ? !!icinde("code") : false; } catch (e) { } b.classList.toggle("act", on); }); }
let ARAC = (() => { try { return localStorage.getItem("juvemi-arac") !== "0"; } catch (e) { return true; } })();
function aracUygula() { $("cmptools").classList.toggle("off", !ARAC); $("aa").classList.toggle("on", ARAC); } aracUygula();
$("aa").onclick = () => { ARAC = !ARAC; try { localStorage.setItem("juvemi-arac", ARAC ? "1" : "0"); } catch (e) { } aracUygula(); };
const EMO = "😀 😂 🥰 😊 😉 😍 🤩 😎 🤔 😅 😴 😢 😮 🙏 👍 👎 👏 🙌 💪 👀 🎉 🎊 🔥 ✨ ⭐ 💡 ✅ ❌ ⚠️ 📌 📎 📝 📅 ⏰ 💰 🛒 📦 🎁 🧸 🎨 ✏️ 📚 🧩 🌈 🌸 🍀 ❤️ 💛 💙 🚀 🎯 📣 💬 ☕".split(" ");
$("emojipop").innerHTML = EMO.map(e => `<button type="button">${e}</button>`).join("");
$("emojipop").querySelectorAll("button").forEach(b => { b.onmousedown = e => e.preventDefault(); b.onclick = () => { secYukle(); document.execCommand("insertText", false, b.textContent); $("emojipop").hidden = true; }; });
function mentionAc(silAt) { $("mentionpop").innerHTML = [["herkes", "herkes"]].concat(ORTAKLAR).map(([k, ad]) => { const m = ekip.find(x => x.id === k); return `<button type="button" data-ad="${esc(ad)}"><span class="ou">${m && m.foto ? `<img src="${esc(m.foto)}" alt="">` : esc(ini(ad))}</span>@${esc(ad)}</button>`; }).join("");
  $("mentionpop").querySelectorAll("button").forEach(b => { b.onmousedown = e => e.preventDefault(); b.onclick = () => { secYukle(); if (silAt) document.execCommand("delete"); document.execCommand("insertHTML", false, `<span class="ment" contenteditable="false">@${esc(b.dataset.ad)}</span>&nbsp;`); $("mentionpop").hidden = true; }; });
  $("mentionpop").hidden = false; $("emojipop").hidden = true; }
$("emojibtn").onclick = () => { secKaydet(); $("emojipop").hidden = !$("emojipop").hidden; $("mentionpop").hidden = true; };
$("mentionbtn").onclick = () => { secKaydet(); $("mentionpop").hidden ? mentionAc(false) : ($("mentionpop").hidden = true); };
TA().addEventListener("input", e => { if (e.data === "@") { secKaydet(); mentionAc(true); } });
document.addEventListener("click", e => { if (!e.target.closest("#emojipop,#emojibtn,#mentionpop,#mentionbtn")) { $("emojipop").hidden = true; $("mentionpop").hidden = true; } });
$("gorusbtn").onclick = () => { addDoc(collection(db, "mesajlar"), { metin: "🎥 Görüntülü görüşme başlattı — katılmak için Görüntülü Görüşme sayfasına geç.", kadi: KADI, ad: MYNAME, kanal: KANAL, ts: Date.now() }).catch(() => { }); go("toplanti"); setTimeout(() => $("meetstart").click(), 300); };
$("dosyaekle").onclick = () => { const K = kanallar.find(k => k.id === KANAL); if (K && lnk(K.klasor)) window.open(K.klasor, "_blank", "noopener"); $("dosyabar").hidden = false; $("dosyalink").focus(); };
$("dosyakapat").onclick = () => { $("dosyabar").hidden = true; };
$("dosyagonder").onclick = () => { const u = $("dosyalink").value.trim(); if (!lnk(u)) { flash("Geçerli bir Drive bağlantısı yapıştır"); return; }
  addDoc(collection(db, "mesajlar"), { tur: "dosya", url: u, dosyaAd: $("dosyaad").value.trim(), ...(() => { const c = editorIcerik(); return { metin: c.metin, html: c.html }; })(), kadi: KADI, ad: MYNAME, kanal: KANAL, ts: Date.now() })
    .then(() => { $("dosyalink").value = ""; $("dosyaad").value = ""; editorTemizle(); $("dosyabar").hidden = true; flash("Dosya paylaşıldı"); }).catch(() => flash("Paylaşılamadı")); };
$("k-yeni").onclick = () => { $("kf-uye").innerHTML = ORTAKLAR.map(([k, ad]) => `<label><input type="checkbox" value="${k}" checked> ${ad}</label>`).join(""); $("k-form").hidden = false; $("kf-ad").focus(); };
$("kf-iptal").onclick = () => { $("k-form").hidden = true; };
$("k-form").onsubmit = e => { e.preventDefault(); const ad = $("kf-ad").value.trim().toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü-]+/g, "-").replace(/^-+|-+$/g, ""); if (!ad) return;
  const uyeler = [...$("kf-uye").querySelectorAll("input:checked")].map(i => i.value); if (!uyeler.includes(KADI)) uyeler.push(KADI);
  const anaK = kanallar.find(k => k.id === "genel");
  setDoc(doc(db, "kanallar", ad), { ad, konu: $("kf-acik").value.trim(), uyeler, sira: 100 + kanallar.length, klasor: (anaK && anaK.ust) || "", olusturan: MYNAME, ts: Date.now() })
    .then(() => { $("k-form").hidden = true; $("kf-ad").value = ""; $("kf-acik").value = ""; KANAL = ad; renderTabs(); flash("Kanal oluşturuldu"); }).catch(() => flash("Oluşturulamadı")); };

/* ---------- toplantı ---------- */
const ODA = "JuvemiEkipOdasi-7k3q9";
$("meetroom").textContent = "meet.jit.si/" + ODA; $("meetnew").href = "https://meet.jit.si/" + ODA;
function meetEnd() { $("meetframe").innerHTML = '<div class="empty">Toplantıdan ayrıldın. Tekrar katılmak için "Toplantıya katıl"a bas.</div>'; $("meetend").hidden = true; $("meetstart").hidden = false; }
$("meetstart").onclick = () => {
  const url = "https://meet.jit.si/" + ODA + "#userInfo.displayName=%22" + encodeURIComponent(MYNAME) + "%22&config.prejoinConfig.enabled=true&config.disableDeepLinking=true&interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE=false";
  $("meetframe").innerHTML = `<iframe src="${url}" allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write" allowfullscreen title="Juvémi toplantı"></iframe>`;
  $("meetstart").hidden = true; $("meetend").hidden = false;
};
$("meetend").onclick = meetEnd;

/* ---------- çevrimiçi ---------- */
function renderOnline() {
  const el = $("online"); if (!el || !ekip.length) return; const now = Date.now();
  el.innerHTML = ekip.map(m => { const d = durum[m.id], on = d && d.aktif && now - (d.son || 0) < 150000;
    const ne = on ? "çevrimiçi" : (d && d.son ? "son görülme " + new Date(d.son).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "çevrimdışı");
    return `<span class="ou${on ? " on" : ""}" title="${esc(m.ad)} · ${ne}">${m.foto ? `<img src="${esc(m.foto)}" alt="">` : esc(ini(m.ad))}</span>`; }).join("");
}
function kalp(aktif) { if (!KADI) return; setDoc(doc(db, "durum", KADI), { son: Date.now(), aktif }).catch(() => { }); }
setInterval(() => { if (KADI && document.visibilityState === "visible") kalp(true); renderOnline(); }, 60000);
document.addEventListener("visibilitychange", () => kalp(document.visibilityState === "visible"));
addEventListener("pagehide", () => kalp(false));

/* ---------- otomatik güncelleme ---------- */
setInterval(async () => {
  try { const v = (await (await fetch("version.txt?t=" + Date.now(), { cache: "no-store" })).text()).trim();
    if (v && window.JV && v !== window.JV && !window.JV.startsWith("__")) { const a = document.activeElement; if (!(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.value)) location.replace(location.pathname + "?v=" + v + location.hash); }
  } catch (e) { }
}, 60000);

/* ---------- ilk kurulum (bir kez, Mustafa girince) ---------- */
window.juvemiKurulum = async S => {
  if (!ME) throw new Error("önce giriş yap");
  const oz = await getDoc(doc(db, "ortak", "ozet"));
  if (!oz.exists()) {
    const b = writeBatch(db);
    b.set(doc(db, "ortak", "ozet"), S.ozet);
    S.moduller.forEach(m => b.set(doc(db, "moduller", m.id), m.data));
    S.gunluk.forEach((l, i) => b.set(doc(db, "gunluk", "ilk" + i), l));
    await b.commit();
  }
  const kadi = (auth.currentUser.email || "").split("@")[0];
  const me = await getDoc(doc(db, "kullanicilar", ME));
  if (!me.exists() || !(me.data().gorevler || []).length) await setDoc(doc(db, "kullanicilar", ME), { ad: MYNAME, gorevler: (S.gorevler[kadi] || []) });
  return "tamam";
};

async function start(kadi) {
  KADI = kadi; kalp(true);
  renderTabs(); renderGenel(); renderTasks(); renderGider();
  unsub.push(onSnapshot(doc(db, "ortak", "ozet"), s => { ozet = s.data() || null; renderGenel(); renderTabs(); }));
  unsub.push(onSnapshot(query(collection(db, "moduller"), orderBy("sira")), s => { mods = s.docs.map(d => Object.assign({ id: d.id }, d.data())); renderTabs(); renderGenel(); }));
  unsub.push(onSnapshot(query(collection(db, "giderler"), orderBy("tarih", "desc")), s => { giderler = s.docs.map(d => Object.assign({ id: d.id }, d.data())); renderGider(); renderGenel(); renderTabs(); }, () => flash("Giderler okunamadı")));
  unsub.push(onSnapshot(query(collection(db, "etkinlikler"), orderBy("tarih")), s => { etk = s.docs.map(d => Object.assign({ id: d.id }, d.data())); renderTabs(); }));
  unsub.push(onSnapshot(query(collection(db, "sermaye"), orderBy("tarih", "desc")), s => { sermaye = s.docs.map(d => Object.assign({ id: d.id }, d.data())); renderTabs(); }));
  unsub.push(onSnapshot(query(collection(db, "haftalar"), orderBy("baslangic")), s => { haftalar = s.docs.map(d => Object.assign({}, d.data(), { id: d.id })); renderTabs(); }));
  unsub.push(onSnapshot(query(collection(db, "geribildirim"), orderBy("ts", "desc")), s => { geri = s.docs.map(d => Object.assign({}, d.data(), { id: d.id })); renderTabs(); }));
  unsub.push(onSnapshot(collection(db, "yolharitasi"), s => { yol = s.docs.map(d => Object.assign({}, d.data(), { id: d.id })); renderTabs(); }));
  unsub.push(onSnapshot(query(collection(db, "toplantilar"), orderBy("tarih", "desc")), s => { toplantilar = s.docs.map(d => Object.assign({}, d.data(), { id: d.id })); renderTabs(); }));
  unsub.push(onSnapshot(query(collection(db, "kanallar"), orderBy("sira")), s => { kanallar = s.docs.map(d => Object.assign({}, d.data(), { id: d.id })); renderTabs(); }));
  unsub.push(onSnapshot(query(collection(db, "mesajlar"), orderBy("ts", "desc"), limit(500)), s => { mesajlar = s.docs.map(d => d.data()).reverse(); renderTabs(); }));
  unsub.push(onSnapshot(collection(db, "durum"), s => { durum = {}; s.docs.forEach(d => durum[d.id] = d.data()); renderOnline(); }));
  unsub.push(onSnapshot(query(collection(db, "ekip"), orderBy("sira")), s => { ekip = s.docs.map(d => Object.assign({}, d.data(), { id: d.id })); renderTabs(); }));
  unsub.push(onSnapshot(collection(db, "butce"), s => { butce = {}; s.docs.forEach(d => butce[d.id] = d.data()); renderTabs(); }));
  unsub.push(onSnapshot(query(collection(db, "gunluk"), orderBy("ts", "desc")), s => { gunluk = s.docs.map(d => d.data()); renderGenel(); }));
  unsub.push(onSnapshot(doc(db, "kullanicilar", ME), s => { if (DRAG || (document.activeElement && (document.activeElement.tagName === "TEXTAREA" || (document.activeElement.closest(".alt-ekle") && document.activeElement.value) || document.activeElement.isContentEditable))) return; const d = s.data(); panel = { gorevler: (d && d.gorevler) || [] }; renderTasks(); renderTabs(); }));
}
