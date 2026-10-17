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

let ME = null, MYNAME = "", ozet = null, mods = [], giderler = [], gunluk = [], panel = { gorevler: [] }, unsub = [];
let TAB = (location.hash || "").slice(1) || (() => { try { return localStorage.getItem("juvemi-tab"); } catch (e) { } })() || "genel";
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
$("logout").onclick = () => signOut(auth);
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
  $("gate").hidden = true; $("app").hidden = false; $("whoname").textContent = MYNAME;
  start(kadi);
});

/* ---------- sekmeler ---------- */
const BASE = ["genel", "gorevler", "giderler"];
function tabs() { return [{ id: "genel", ad: "Genel Bakış" }, { id: "gorevler", ad: "Görevlerim" }, { id: "giderler", ad: "Giderler" }].concat(mods); }
function go(t) { TAB = t; try { localStorage.setItem("juvemi-tab", t); } catch (e) { } history.replaceState(null, "", "#" + t); renderTabs(); scrollTo(0, 0); }
function renderTabs() {
  const T = tabs(); if (!T.some(t => t.id === TAB) && (mods.length || BASE.includes(TAB))) TAB = "genel";
  $("tabs").innerHTML = T.map(t => `<button class="tab" role="tab" data-t="${esc(t.id)}" aria-selected="${t.id === TAB}">${esc(t.ad)}</button>`).join("");
  $("tabs").querySelectorAll(".tab").forEach(b => b.onclick = () => go(b.dataset.t));
  const mod = mods.find(m => m.id === TAB), known = BASE.includes(TAB) || mod;
  document.querySelectorAll(".pane").forEach(p => p.hidden = !(p.dataset.pane === TAB || (mod && p.dataset.pane === "mod") || (!known && p.dataset.pane === "genel")));
  if (mod) $("modpane").innerHTML = `<section><h2>${esc(mod.ad)}</h2><p class="muted" style="margin:0 0 12px">${esc(mod.aciklama)}</p><div class="mods">${(mod.bolumler || []).map(b => `<div class="mod"><div class="row"><b>${esc(b.ad)}</b><span class="tag ${esc(b.durum)}">${TAG[b.durum] || esc(b.durum)}</span></div>${b.not ? `<div class="muted">${esc(b.not)}</div>` : ""}</div>`).join("")}</div></section>`;
}

/* ---------- genel ---------- */
function renderGenel() {
  if (ozet) {
    $("facts").innerHTML = (ozet.netlesenler || []).map(f => `<div class="fact${f.acik ? " pend" : ""}"><b>${esc(f.b)}</b><span>${esc(f.v)}</span></div>`).join("") || '<div class="empty">Henüz kayıt yok.</div>';
    $("risks").innerHTML = (ozet.riskler || []).map(r => `<li>${esc(r)}</li>`).join("");
  } else $("facts").innerHTML = '<div class="empty">Henüz kayıt yok.</div>';
  $("ov").innerHTML = mods.map(m => { const B = m.bolumler || [], n = B.filter(b => b.durum !== "bos").length; return `<button class="fact ovc" data-t="${esc(m.id)}"><b>${esc(m.ad)}</b><span>${n} / ${B.length} başladı</span></button>`; }).join("");
  const top = giderler.reduce((s, g) => s + (+g.tutar || 0), 0);
  $("gozet").innerHTML = `<button class="fact ovc" data-t="giderler"><b>Toplam harcama</b><span>${TL(top)}</span></button><button class="fact ovc" data-t="giderler"><b>Kayıt sayısı</b><span>${giderler.length} gider</span></button>`;
  document.querySelectorAll("#ov .ovc,#gozet .ovc").forEach(b => b.onclick = () => go(b.dataset.t));
  $("log").innerHTML = gunluk.map(l => { const t = new Date(l.ts).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); return `<li><time>${esc(t)}</time><span>${l.yazan ? `<b>${esc(l.yazan)}</b> · ` : ""}${esc(l.metin)}</span></li>`; }).join("") || '<li class="muted">Henüz kayıt yok.</li>';
}

/* ---------- görevlerim ---------- */
let DRAG = null;
function savePanel() { setDoc(doc(db, "kullanicilar", ME), { ad: MYNAME, gorevler: panel.gorevler }).then(() => flash("Kaydedildi")).catch(() => flash("Kaydedilemedi")); renderTasks(); }
function renderTasks() {
  const g = panel.gorevler || [], done = g.filter(t => t.durum === "bitti").length;
  $("pnum").textContent = done + " / " + g.length; $("barfill").style.width = (g.length ? 100 * done / g.length : 0) + "%";
  const el = $("tasks");
  if (!g.length) { el.innerHTML = '<div class="empty">Henüz görevin yok. Yukarıdan ilk görevini ekle.</div>'; return; }
  const focused = document.activeElement && document.activeElement.id; el.innerHTML = "";
  g.forEach((t, i) => {
    const s = t.durum || "acik", c = document.createElement("article"); c.className = "task" + (s === "bitti" ? " done" : ""); c.dataset.id = t.id;
    c.innerHTML = `<div class="num" title="Tutup sürükle">${i + 1}<small>⋮⋮</small></div><div class="ttl">${esc(t.baslik)}</div><button class="pill" data-s="${s}" type="button">${LBL[s]}</button>${t.aciklama ? `<div class="desc">${esc(t.aciklama)}</div>` : ""}<textarea class="note" id="n-${esc(t.id)}" placeholder="Not ekle…">${esc(t.not || "")}</textarea><button class="del" type="button">Sil</button>`;
    c.querySelector(".pill").onclick = () => { t.durum = ST[(ST.indexOf(s) + 1) % 3]; savePanel(); };
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
  panel.gorevler.push({ id: "g" + Date.now(), baslik: b, aciklama: $("add-d").value.trim(), durum: "acik", not: "" }); $("add-t").value = ""; $("add-d").value = ""; savePanel();
};
$("logform").onsubmit = e => {
  e.preventDefault(); const v = $("logtext").value.trim(); if (!v) return;
  addDoc(collection(db, "gunluk"), { metin: v, yazan: MYNAME, ts: Date.now() }).then(() => { $("logtext").value = ""; flash("Eklendi"); }).catch(() => flash("Eklenemedi"));
};

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
  renderTabs(); renderGenel(); renderTasks(); renderGider();
  unsub.push(onSnapshot(doc(db, "ortak", "ozet"), s => { ozet = s.data() || null; renderGenel(); }));
  unsub.push(onSnapshot(query(collection(db, "moduller"), orderBy("sira")), s => { mods = s.docs.map(d => Object.assign({ id: d.id }, d.data())); renderTabs(); renderGenel(); }));
  unsub.push(onSnapshot(query(collection(db, "giderler"), orderBy("tarih", "desc")), s => { giderler = s.docs.map(d => Object.assign({ id: d.id }, d.data())); renderGider(); renderGenel(); }, () => flash("Giderler okunamadı")));
  unsub.push(onSnapshot(query(collection(db, "gunluk"), orderBy("ts", "desc")), s => { gunluk = s.docs.map(d => d.data()); renderGenel(); }));
  unsub.push(onSnapshot(doc(db, "kullanicilar", ME), s => { if (DRAG || (document.activeElement && document.activeElement.tagName === "TEXTAREA")) return; const d = s.data(); panel = { gorevler: (d && d.gorevler) || [] }; renderTasks(); }));
}
