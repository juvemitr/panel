import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, collection, onSnapshot, setDoc, addDoc, deleteDoc, getDoc, query, orderBy, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

let ME = null, MYNAME = "", ozet = null, mods = [], giderler = [], gunluk = [], etk = [], sermaye = [], butce = {}, ekip = [], EDIT = null, durum = {}, KADI = "", panel = { gorevler: [] }, unsub = [];
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
  { id: "ekip", ad: "Ekip", renk: "#2F8C8C", ik: "ekipapp", alt: () => ekip.length ? ekip.length + " kurucu ortak" : "Kurucu ortaklar" },
  { id: "butce", ad: "Bütçe & Sermaye", renk: "#7A6CB0", ik: "butce", alt: () => { const s = sermaye.reduce((t, x) => t + (+x.tutar || 0), 0); return s ? "Sermaye " + TL(s) : "Sermaye ve aylık plan"; } }
];
function go(t) { TAB = t; try { localStorage.setItem("juvemi-tab", t); } catch (e) { } history.replaceState(null, "", "#" + t); renderTabs(); scrollTo(0, 0); }
$("logo").onclick = () => go("ana");
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
  const mod = mods.find(m => m.id === TAB), app = APPS.find(x => x.id === TAB && !x.yakinda);
  if (!mod && !app && TAB !== "ana" && mods.length) TAB = "ana";
  $("apptitle").textContent = mod ? mod.ad : (app ? app.ad : "Uygulamalar");
  $("sidenav").innerHTML = `<button type="button" class="nav-i" data-t="ana"${TAB === "ana" ? ' aria-current="page"' : ""} title="Ana ekran"><span class="si">${svg("home")}</span><span class="sl">Ana ekran</span></button>`
    + APPS.map(x => `<button type="button" class="nav-i" data-t="${x.id}"${x.yakinda ? " disabled" : ""}${TAB === x.id ? ' aria-current="page"' : ""} title="${esc(x.ad)}"><span class="si" style="--c:${x.renk}">${svg(x.ik)}</span><span class="sl">${esc(x.ad)}</span></button>`).join("")
    + (mods.length ? `<div class="side-sep">Şirket</div>` + mods.map(m => `<button type="button" class="nav-i nm" data-t="${esc(m.id)}"${TAB === m.id ? ' aria-current="page"' : ""} title="${esc(m.ad)}"><span class="si">${svg(m.id)}</span><span class="sl">${esc(m.ad)}</span></button>`).join("") : "");
  $("sidenav").querySelectorAll(".nav-i:not([disabled])").forEach(b => b.onclick = () => go(b.dataset.t));
  document.querySelectorAll(".pane").forEach(p => p.hidden = !(p.dataset.pane === TAB || (mod && p.dataset.pane === "mod")));
  $("apps").innerHTML = APPS.map(x => `<button type="button" class="app" data-t="${x.id}"${x.yakinda ? " disabled" : ""}><i style="--c:${x.renk}">${svg(x.ik, 24)}</i><b>${esc(x.ad)}</b><span>${esc(x.alt())}</span></button>`).join("");
  $("apps").querySelectorAll(".app:not([disabled])").forEach(b => b.onclick = () => go(b.dataset.t));
  if (mod) $("modpane").innerHTML = `<section><p class="muted" style="margin:0 0 12px">${esc(mod.aciklama)}</p><div class="mods">${(mod.bolumler || []).map(b => `<div class="mod"><div class="row"><b>${esc(b.ad)}</b><span class="tag ${esc(b.durum)}">${TAG[b.durum] || esc(b.durum)}</span></div>${b.not ? `<div class="muted">${esc(b.not)}</div>` : ""}</div>`).join("")}</div></section>`;
  if (TAB === "takvim") renderCal();
  if (TAB === "butce") renderButce();
  if (TAB === "ekip") renderEkip();
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
function renderTasks() {
  const g = panel.gorevler || [], done = g.filter(t => t.durum === "bitti").length;
  $("pnum").textContent = done + " / " + g.length; $("barfill").style.width = (g.length ? 100 * done / g.length : 0) + "%";
  const el = $("tasks");
  if (!g.length) { el.innerHTML = '<div class="empty">Henüz görevin yok. Yukarıdan ilk görevini ekle.</div>'; return; }
  const focused = document.activeElement && document.activeElement.id; el.innerHTML = "";
  g.forEach((t, i) => {
    const s = t.durum || "acik", c = document.createElement("article"); c.className = "task" + (s === "bitti" ? " done" : ""); c.dataset.id = t.id;
    c.innerHTML = `<div class="num" title="Tutup sürükle">${i + 1}<small>⋮⋮</small></div><div class="ttl">${esc(t.baslik)}</div><button class="pill" data-s="${s}" type="button">${LBL[s]}</button>${t.aciklama ? `<div class="desc">${esc(t.aciklama)}</div>` : ""}<input type="date" class="tdate" value="${esc(t.tarih || "")}" aria-label="Tarih" title="Tarih (takvimde görünür)"><textarea class="note" id="n-${esc(t.id)}" placeholder="Not ekle…">${esc(t.not || "")}</textarea><button class="del" type="button">Sil</button>`;
    c.querySelector(".pill").onclick = () => { t.durum = ST[(ST.indexOf(s) + 1) % 3]; savePanel(); };
    const td = c.querySelector(".tdate"); td.onchange = () => { t.tarih = td.value; savePanel(); };
    const ta = c.querySelector("textarea"); ta.onchange = () => { t.not = ta.value; savePanel(); };
    const del = c.querySelector(".del"); del.onclick = () => { if (!del.classList.contains("sure")) { del.classList.add("sure"); del.textContent = "Emin misin? Silmek için tekrar tıkla"; setTimeout(() => { del.classList.remove("sure"); del.textContent = "Sil"; }, 4000); return; } panel.gorevler = panel.gorevler.filter(x => x.id !== t.id); savePanel(); };
    c.querySelector(".num").onpointerdown = e => {
      e.preventDefault(); DRAG = t.id; c.classList.add("dragging"); document.body.style.userSelect = "none"; let tgt = null, top = true;
      const mv = ev => {
        document.querySelectorAll(".task").forEach(x => x.classList.remove("over-top", "over-bot")); const el2 = document.elementFromPoint(ev.clientX, ev.clientY), k = el2 && el2.closest(".task"); tgt = null;
        if (k && k !== c) { const r = k.getBoundingClientRect(); top = ev.clientY < r.top + r.height / 2; k.classList.add(top ? "over-top" : "over-bot"); tgt = k.dataset.id; }
        if (ev.clientY < 60) scrollBy(0, -12); else if (ev.clientY > innerHeight - 60) scrollBy(0, 12);
      };
      const up = () => {
        removeEventListener("pointermove", mv); removeEventListener("pointerup", up); document.body.style.userSelect = ""; DRAG = null;
        document.querySelectorAll(".task").forEach(x => x.classList.remove("dragging", "over-top", "over-bot"));
        if (tgt) { const G = panel.gorevler, [m] = G.splice(G.findIndex(x => x.id === t.id), 1); let to = G.findIndex(x => x.id === tgt); if (!top) to++; G.splice(to, 0, m); savePanel(); }
      };
      addEventListener("pointermove", mv); addEventListener("pointerup", up);
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
  unsub.push(onSnapshot(doc(db, "ortak", "ozet"), s => { ozet = s.data() || null; renderGenel(); }));
  unsub.push(onSnapshot(query(collection(db, "moduller"), orderBy("sira")), s => { mods = s.docs.map(d => Object.assign({ id: d.id }, d.data())); renderTabs(); renderGenel(); }));
  unsub.push(onSnapshot(query(collection(db, "giderler"), orderBy("tarih", "desc")), s => { giderler = s.docs.map(d => Object.assign({ id: d.id }, d.data())); renderGider(); renderGenel(); renderTabs(); }, () => flash("Giderler okunamadı")));
  unsub.push(onSnapshot(query(collection(db, "etkinlikler"), orderBy("tarih")), s => { etk = s.docs.map(d => Object.assign({ id: d.id }, d.data())); renderTabs(); }));
  unsub.push(onSnapshot(query(collection(db, "sermaye"), orderBy("tarih", "desc")), s => { sermaye = s.docs.map(d => Object.assign({ id: d.id }, d.data())); renderTabs(); }));
  unsub.push(onSnapshot(collection(db, "durum"), s => { durum = {}; s.docs.forEach(d => durum[d.id] = d.data()); renderOnline(); }));
  unsub.push(onSnapshot(query(collection(db, "ekip"), orderBy("sira")), s => { ekip = s.docs.map(d => Object.assign({}, d.data(), { id: d.id })); renderTabs(); }));
  unsub.push(onSnapshot(collection(db, "butce"), s => { butce = {}; s.docs.forEach(d => butce[d.id] = d.data()); renderTabs(); }));
  unsub.push(onSnapshot(query(collection(db, "gunluk"), orderBy("ts", "desc")), s => { gunluk = s.docs.map(d => d.data()); renderGenel(); }));
  unsub.push(onSnapshot(doc(db, "kullanicilar", ME), s => { if (DRAG || (document.activeElement && document.activeElement.tagName === "TEXTAREA")) return; const d = s.data(); panel = { gorevler: (d && d.gorevler) || [] }; renderTasks(); renderTabs(); }));
}
