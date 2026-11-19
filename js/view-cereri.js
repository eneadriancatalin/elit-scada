// ELIT SCADA - vedere "Cereri departamente": butoane pe departament -> raspuns live + fisa de raspuns + registru cereri
(function () {
  const E = window.ELIT;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ECRAN = { capacitate: "Producție & capacitate", harta: "Harta halei", control: "Utilaje & control", alarme: "Alarme & jurnal", mentenanta: "Mentenanță & KPI", flux: "Flux informațional" };
  const KEY = "elit-cereri", KSEL = "elit-cereri-dep";
  const norm = t => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let root, reg = [], sel = "", q = "", lastLive = 0;

  // ---------- helperi de calcul pentru raspunsurile live
  const nf = (v, d = 0) => v.toLocaleString("ro-RO", { minimumFractionDigits: d, maximumFractionDigits: d });
  const kgT = kg => kg >= 10000 ? nf(kg / 1000, 1) + " t" : nf(kg) + " kg";
  const pct = v => nf(v * 100, 1) + "%";
  const val = (id, k) => E.byId[id].values[k];
  const day = 864e5;
  const daysTo = t => Math.ceil((t - Date.now()) / day);
  const prodEq = () => E.equipment.filter(e => !["Z7", "Z8"].includes(e.zone));
  const avg = (a, f) => a.reduce((s, x) => s + f(x), 0) / a.length;
  function capa(ture = 2, zile = 6) {
    const c = E.capacity(); const p8 = c.rate * 8;
    return { c, p8, pDay: p8 * ture, pWeek: p8 * ture * zile, max8: c.nominal * c.quality * 8 };
  }
  function energyToday() {
    const h = E.byId.PT01.history.putere; const p = h.length ? avg(h, x => x) : E.byId.PT01.values.putere;
    const now = new Date(); return p * (now.getHours() + now.getMinutes() / 60);
  }
  const planned = (n) => E.equipment.filter(e => daysTo(e.nextMaint) <= n).sort((a, b) => a.nextMaint - b.nextMaint);
  const notRunning = () => E.equipment.filter(e => e.status !== "run");
  const stLbl = e => UI.statusLabel[e.status] + (e.faultReason ? " – " + e.faultReason : "");
  const ccpState = (id, k) => { const e = E.byId[id], p = e.params.find(p => p.key === k); return E.paramState(e, p); };

  // fiecare departament: lista de [eticheta, valoare, stare?]
  const LIVE = {
    "Director General": () => {
      const k = E.kpi(), x = capa();
      return [["Disponibilitate utilaje", pct(k.availability)], ["OEE producție", pct(k.oee)],
        ["MTBF / MTTR mediu", `${nf(avg(E.equipment, e => e.mtbf))} h / ${nf(avg(E.equipment, e => e.mttr), 1)} h`],
        ["Produs azi", kgT(x.c.producedToday)], ["Proiecție săptămână", kgT(x.pWeek)],
        ["Alarme active", String(k.activeAlarms), k.critAlarms ? "crit" : k.activeAlarms ? "warn" : "ok"]];
    },
    "Producție": () => {
      const x = capa(), nr = notRunning();
      return [["Ritm linie acum", nf(x.c.rate) + " kg/h"], ["Gâtuire", x.c.bottleneck.name.replace("Racire", "Răcire")],
        ["Cât iese pe tură (8 h)", kgT(x.p8)],
        ["Utilaje care nu merg", nr.length ? nr.map(e => `${e.id} (${stLbl(e)})`).join(", ") : "toate în funcțiune", nr.some(e => e.status === "fault") ? "crit" : nr.length ? "warn" : "ok"],
        ["Mentenanță în 7 zile", planned(7).map(e => `${e.id} ${UI.date(e.nextMaint)}`).join(", ") || "nimic programat"]];
    },
    "Calitate": () => [
      ["Temp. miez Celulă 1 (CCP ≥ 70 °C)", nf(val("AF01", "tempMiez"), 1) + " °C", ccpState("AF01", "tempMiez")],
      ["Temp. miez Celulă 2 (CCP ≥ 70 °C)", nf(val("AF02", "tempMiez"), 1) + " °C", ccpState("AF02", "tempMiez")],
      ["Cameră frig materie primă (0–4 °C)", nf(val("CF01", "temp"), 1) + " °C", ccpState("CF01", "temp")],
      ["Depozit produs finit (0–4 °C)", nf(val("DEP01", "temp"), 1) + " °C", ccpState("DEP01", "temp")],
      ["Maturare 1: temp. / umiditate", `${nf(val("MAT01", "temp"), 1)} °C / ${nf(val("MAT01", "umid"))}%`, E.eqState(E.byId.MAT01)],
      ["Detector metale: respingeri", nf(val("DM01", "rejecturi"), 1) + " /h", ccpState("DM01", "rejecturi")]],
    "Achiziții": () => {
      const p = planned(14);
      return [["Utilaje cu mentenanță în 14 zile", String(p.length)],
        ...p.slice(0, 5).map(e => [`${e.id} ${e.name}`, `${UI.date(e.nextMaint)} · kit piese revizie`]),
        ["Utilaje în defect (piese urgente)", E.equipment.filter(e => e.status === "fault").map(e => e.id).join(", ") || "niciunul", E.equipment.some(e => e.status === "fault") ? "crit" : "ok"]];
    },
    "Logistică": () => {
      const x = capa();
      return [["Temperatură depozit PF", nf(val("DEP01", "temp"), 1) + " °C", ccpState("DEP01", "temp")],
        ["Grad ocupare depozit", nf(val("DEP01", "ocupare")) + "%", ccpState("DEP01", "ocupare")],
        ["Temperatură rampă", nf(val("RMP01", "temp"), 1) + " °C", ccpState("RMP01", "temp")],
        ["Rampă expediție", UI.statusLabel[E.byId.RMP01.status]],
        ["Produs finit pe tură (8 h)", kgT(x.p8)], ["Produs finit pe zi (2 ture)", kgT(x.pDay)]];
    },
    "Vânzări": () => {
      const x = capa(), p = planned(7);
      return [["Produs azi", kgT(x.c.producedToday)], ["Pe tură de 8 ore", kgT(x.p8)], ["Pe zi (2 ture)", kgT(x.pDay)],
        ["Pe săptămână (6 zile)", kgT(x.pWeek)], ["Capacitate liberă pe tură", kgT(Math.max(0, x.max8 - x.p8)) + " (dacă merg toate utilajele)"],
        ["Opriri planificate în 7 zile", p.map(e => `${e.id} ${UI.date(e.nextMaint)}`).join(", ") || "niciuna", p.length ? "warn" : "ok"]];
    },
    "Marketing": () => {
      const x = capa();
      return [["Capacitate maximă linie", nf(x.c.nominal) + " kg/h"], ["Utilizare actuală", pct(x.c.rate / (x.c.nominal * x.c.quality))],
        ["Celule afumare disponibile", ["AF01", "AF02"].filter(id => E.byId[id].status === "run").length + " din 2"],
        ["Camere maturare (crud-uscate)", ["MAT01", "MAT02"].filter(id => E.byId[id].status === "run").length + " din 2"],
        ["Linie feliere + ambalare MAP", E.byId.FEL01.status === "run" && E.byId.AMB01.status === "run" ? "disponibilă" : "indisponibilă"]];
    },
    "IT": () => {
      const faults = E.events.filter(e => e.type === "alarm" && /DEFECT/.test(e.msg)).slice(0, 3);
      return [["Utilaje conectate la SCADA", `${E.equipment.length} din ${E.equipment.length}`, "ok"],
        ["Evenimente în jurnal", String(E.events.length)],
        ["Alarme neconfirmate", String(E.kpi().unackAlarms), E.kpi().unackAlarms ? "warn" : "ok"],
        ...faults.map(f => [UI.time(f.time), f.msg])];
    },
    "Juridic": () => [
      ["Centrală abur CAZ01 – autorizație ISCIR", "valabilă până la 14.03.2027", "ok"],
      ["Stație frig NH3 FRG01 – verificare ISCIR", "valabilă până la 02.12.2026", daysTo(new Date(2026, 11, 2)) < 30 ? "warn" : "ok"],
      ["Autorizație de mediu (epurare EPU01)", "valabilă până la 30.06.2028", "ok"],
      ["pH evacuare ape uzate (6,5–8,5)", nf(val("EPU01", "ph"), 2), ccpState("EPU01", "ph")],
      ["Contracte service utilaje", "9 active · 2 de reînnoit în 60 de zile", "warn"]],
    "Contabilitate": () => {
      const kwh = energyToday();
      return [["Consum energie azi", nf(kwh) + " kWh"], ["Cost energie azi (0,85 lei/kWh)", nf(kwh * 0.85) + " lei"],
        ["Putere acum", nf(val("PT01", "putere")) + " kW"],
        ["Opriri neplanificate luna aceasta", String(E.equipment.reduce((s, e) => s + e.stops, 0))],
        ["Utilaje în mentenanță acum", E.equipment.filter(e => e.status === "maint").map(e => e.id).join(", ") || "niciunul"]];
    }
  };

  const CSS = `
  .q-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
  .q-head h2 { margin: 0; font-size: 20px; font-weight: 600; }
  .q-head p { margin: 4px 0 0; color: var(--muted); max-width: 720px; }
  .q-search { width: 300px; max-width: 100%; }
  .q-deps { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; position: sticky; top: 0; z-index: 5; background: var(--bg); padding: 8px 0; }
  .q-deps button { height: 40px; padding: 0 14px; font-size: 14px; display: inline-flex; gap: 8px; align-items: center; }
  .q-deps button small { font: 500 11px var(--mono); color: var(--muted); }
  .q-deps button.on { background: var(--text); color: var(--panel); border-color: var(--text); }
  .q-deps button.on small { color: inherit; opacity: .7; }
  .q-layout { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 16px; align-items: start; }
  @media (max-width: 1100px) { .q-layout { grid-template-columns: minmax(0, 1fr); } }
  .q-main { display: grid; gap: 16px; min-width: 0; }
  .q-live { background: var(--panel); border: 1px solid var(--text); border-radius: var(--radius); padding: 18px; }
  .q-live-h { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .q-live-h h3 { margin: 0; font-size: 18px; font-weight: 600; }
  .q-live-h span { color: var(--muted); font-size: 12px; }
  .q-kv { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); border-top: 1px solid var(--line); }
  .q-kv > div { padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 14px; min-width: 0; }
  .q-kv .k { color: var(--muted); padding-right: 12px; }
  .q-kv .v { font-family: var(--mono); font-weight: 500; display: flex; gap: 8px; align-items: baseline; overflow-wrap: anywhere; }
  .q-kv .v i { width: 8px; height: 8px; border-radius: 50%; flex: none; align-self: center; }
  .q-kv .v i.ok { background: var(--ok); } .q-kv .v i.warn { background: var(--warn); } .q-kv .v i.crit { background: var(--crit); }
  @media (max-width: 560px) { .q-kv { grid-template-columns: minmax(0, 1fr); } .q-kv .k { border-bottom: none !important; padding-bottom: 0; } }
  .q-live-a { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .q-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
  @media (max-width: 420px) { .q-cards { grid-template-columns: minmax(0, 1fr); } }
  .q-card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px; min-width: 0; }
  .q-card h4 { margin: 0 0 10px; font-size: 15px; font-weight: 600; display: flex; justify-content: space-between; gap: 8px; align-items: center; }
  .q-card h4 small { font: 500 11px var(--mono); color: var(--muted); }
  .q-card h4 button { height: 26px; font-size: 12px; }
  .q-sec { font-size: 11px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; margin: 10px 0 6px; }
  .q-item { border-top: 1px solid var(--line); padding: 8px 0; }
  .q-item:first-of-type { border-top: none; padding-top: 0; }
  .q-item b { font-weight: 500; display: block; }
  .q-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; align-items: center; }
  .q-chip { font: 500 11px var(--mono); border: 1px solid var(--line); border-radius: 4px; padding: 1px 6px; color: var(--muted); white-space: nowrap; }
  .q-go { height: 24px; font-size: 12px; padding: 0 8px; }
  .q-in { color: var(--muted); font-size: 13px; padding: 3px 0; }
  .q-in .q-chip { color: var(--accent); margin-right: 6px; }
  .q-none { color: var(--muted); padding: 24px; text-align: center; border: 1px dashed var(--line); border-radius: var(--radius); grid-column: 1 / -1; }
  .q-side { position: sticky; top: 64px; }
  .q-form { display: grid; gap: 8px; margin-bottom: 14px; }
  .q-form select, .q-form input { width: 100%; }
  .q-reg { display: grid; gap: 8px; max-height: 60vh; overflow: auto; }
  .q-r { border: 1px solid var(--line); border-radius: var(--radius); padding: 10px; }
  .q-r-top { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--muted); }
  .q-r b { display: block; margin: 4px 0 8px; font-weight: 500; font-size: 13px; }
  .q-r-act { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .q-r-act button { height: 26px; font-size: 12px; }
  .q-empty { color: var(--muted); font-size: 13px; text-align: center; padding: 16px; border: 1px dashed var(--line); border-radius: var(--radius); }
  `;

  function load() {
    try { reg = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { reg = []; }
    try { sel = localStorage.getItem(KSEL) || ""; } catch (e) {}
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(reg)); } catch (e) {} }
  function saveSel() { try { localStorage.setItem(KSEL, sel); } catch (e) {} }

  const deps = () => E.data.departamente.filter(d => d !== "Tehnic");
  const outsOf = d => E.data.fluxuri.dinTEH.filter(f => f.dep === d);
  const insOf = d => E.data.fluxuri.catreTEH.filter(f => f.dep === d);
  const hit = d => !q || norm([d, ...outsOf(d).map(f => f.info + " " + f.tag + " " + f.format), ...insOf(d).map(f => f.info + " " + f.cod)].join(" ")).includes(q);

  function card(d) {
    return `
      <div class="q-card" data-dep="${esc(d)}">
        <h4>${sel ? "Fișa de răspuns" : esc(d)} ${sel ? `<small>${outsOf(d).length} ieșiri · ${insOf(d).length} intrări</small>` : `<button data-pick="${esc(d)}">Deschide →</button>`}</h4>
        <div class="q-sec">Ne cer / le dăm</div>
        ${outsOf(d).map(f => `
          <div class="q-item"><b>${esc(f.info)}</b>
            <div class="q-meta"><span class="q-chip">${esc(f.tag)}</span><span class="q-chip">${esc(f.format)}</span><span class="q-chip">${esc(f.termen)}</span>
              <button class="q-go" data-go="${esc(f.ecran)}">Arată în ${esc(ECRAN[f.ecran] || f.ecran)} →</button></div>
          </div>`).join("") || `<div class="q-in">—</div>`}
        <div class="q-sec">Le cerem noi</div>
        ${insOf(d).map(f => `<div class="q-in"><span class="q-chip">${esc(f.cod)}</span>${esc(f.info)}</div>`).join("") || `<div class="q-in">—</div>`}
      </div>`;
  }

  function liveRows(d) { try { return (LIVE[d] || (() => []))(); } catch (e) { return [["Eroare", e.message, "crit"]]; } }
  function liveHtml(d) {
    return liveRows(d).map(([k, v, s]) => `<div class="k">${esc(k)}</div><div class="v">${s ? `<i class="${s}"></i>` : ""}<span>${esc(v)}</span></div>`).join("");
  }
  function liveText(d) {
    return `Departament Tehnic → ${d} (${new Date().toLocaleString("ro-RO")}):\n` + liveRows(d).map(([k, v]) => `• ${k}: ${v}`).join("\n");
  }

  function drawMain() {
    const m = root.querySelector(".q-main");
    if (sel) {
      m.innerHTML = `
        <div class="q-live">
          <div class="q-live-h"><h3>${esc(sel)} – informații live</h3><span>se actualizează automat din SCADA</span></div>
          <div class="q-kv"></div>
          <div class="q-live-a"><button class="primary" data-copy>Copiază tot</button><button data-reg>Înregistrează cererea</button></div>
        </div>
        <div class="q-cards" style="grid-template-columns:minmax(0,1fr)">${card(sel)}</div>`;
      drawLive(true);
    } else {
      const list = deps().filter(hit);
      m.innerHTML = `<div class="q-cards">${list.map(card).join("") || `<div class="q-none">Nimic găsit pentru „${esc(q)}”. Încearcă alt cuvânt (ex. temperatură, piese, OEE, energie).</div>`}</div>`;
    }
  }
  function drawLive(force) {
    if (!sel) return; const now = Date.now(); if (!force && now - lastLive < 1000) return; lastLive = now;
    const kv = root.querySelector(".q-kv"); if (kv) kv.innerHTML = liveHtml(sel);
  }
  function drawDeps() {
    root.querySelector(".q-deps").innerHTML =
      `<button data-pick="" class="${sel ? "" : "on"}">Toate</button>` +
      deps().map(d => `<button data-pick="${esc(d)}" class="${d === sel ? "on" : ""}" ${q && !hit(d) ? 'style="opacity:.35"' : ""}>${esc(d)} <small>${outsOf(d).length}</small></button>`).join("");
  }
  function regHtml() {
    if (!reg.length) return `<div class="q-empty">Nicio cerere înregistrată încă.<br>Când vine cineva, alege departamentul și înregistrează cererea.</div>`;
    return reg.map((r, i) => `
      <div class="q-r">
        <div class="q-r-top"><span>${esc(r.dep)}</span><span class="mono">${new Date(r.t).toLocaleString("ro-RO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span></div>
        <b>${esc(r.ce)}</b>
        <div class="q-r-act">
          <span class="pill ${r.st === "Trimisă" ? "st-run" : r.st === "În lucru" ? "st-maint" : "st-stop"}">${esc(r.st)}</span>
          ${r.st !== "Trimisă" ? `<button data-adv="${i}">${r.st === "Primită" ? "Preia" : "Marchează trimisă"}</button>` : ""}
          <button data-del="${i}">Șterge</button>
        </div>
      </div>`).join("");
  }
  const optsCe = d => outsOf(d).map(f => `<option>${esc(f.info)}</option>`).join("") + `<option value="__alt">Altă cerere…</option>`;
  function syncForm() {
    const dep = root.querySelector(".q-dep"); if (sel) dep.value = sel;
    root.querySelector(".q-ce").innerHTML = optsCe(dep.value); root.querySelector(".q-alt").style.display = "none";
  }
  function pick(d) { sel = d; saveSel(); drawDeps(); drawMain(); syncForm(); }
  function drawAll() { drawDeps(); drawMain(); root.querySelector(".q-reg").innerHTML = regHtml(); }

  function init(r) {
    root = r; load();
    const hd = decodeURIComponent(location.hash).split("/")[1]; if (hd) sel = hd; // link direct: #cereri/Vânzări
    if (sel && !deps().includes(sel)) sel = "";
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    root.innerHTML = `
      <div class="q-head">
        <div><h2>Cereri departamente</h2>
        <p>Vine cineva de la alt departament? Apasă pe departamentul lui: vezi informațiile live pe care i le dăm, fișa de răspuns și ce îi cerem noi.</p></div>
        <input class="q-search" type="search" placeholder="Caută: temperatură, piese, OEE, energie…" autocomplete="off">
      </div>
      <div class="q-deps"></div>
      <div class="q-layout">
        <div class="q-main"></div>
        <div class="panel q-side">
          <h3>Registru cereri primite</h3>
          <div class="q-form">
            <select class="q-dep">${deps().map(d => `<option>${esc(d)}</option>`).join("")}</select>
            <select class="q-ce"></select>
            <input class="q-alt" placeholder="Descrie cererea…" style="display:none">
            <button class="primary q-add">Înregistrează cererea</button>
          </div>
          <div class="q-reg"></div>
        </div>
      </div>`;
    const $ = s => root.querySelector(s);
    $(".q-search").oninput = e => { q = norm(e.target.value.trim()); if (q && sel) { sel = ""; saveSel(); } drawDeps(); drawMain(); };
    $(".q-dep").onchange = () => { root.querySelector(".q-ce").innerHTML = optsCe($(".q-dep").value); $(".q-alt").style.display = "none"; };
    $(".q-ce").onchange = e => { $(".q-alt").style.display = e.target.value === "__alt" ? "" : "none"; };
    $(".q-add").onclick = () => {
      const dep = $(".q-dep").value, ce = $(".q-ce").value === "__alt" ? $(".q-alt").value.trim() : $(".q-ce").value;
      if (!ce) { UI.toast("Descrie cererea", "err"); return; }
      reg.unshift({ dep, ce, st: "Primită", t: Date.now() }); save();
      E.log(null, `Cerere primită de la ${dep}: ${ce}`, "system"); $(".q-alt").value = ""; root.querySelector(".q-reg").innerHTML = regHtml(); UI.toast("Cerere înregistrată");
    };
    root.addEventListener("click", e => {
      const p = e.target.closest("[data-pick]"); if (p) { pick(p.dataset.pick); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      const go = e.target.closest("[data-go]"); if (go) { UI.show(go.dataset.go); return; }
      if (e.target.closest("[data-copy]")) {
        const t = liveText(sel);
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => UI.toast("Informațiile pentru " + sel + " au fost copiate"), () => UI.toast("Copierea nu e permisă aici – selectează textul manual", "err"));
        E.log(null, `Informații transmise către ${sel}`, "system"); return;
      }
      if (e.target.closest("[data-reg]")) { $(".q-dep").value = sel; syncForm(); $(".q-ce").focus(); UI.toast("Alege cererea în registru și apasă Înregistrează"); return; }
      const adv = e.target.closest("[data-adv]");
      if (adv) {
        const r = reg[+adv.dataset.adv]; r.st = r.st === "Primită" ? "În lucru" : "Trimisă"; save();
        E.log(null, `Cerere ${r.dep} – ${r.st.toLowerCase()}: ${r.ce}`, "system"); root.querySelector(".q-reg").innerHTML = regHtml();
        if (r.st === "Trimisă") UI.toast(`Răspuns trimis către ${r.dep}`);
        return;
      }
      const del = e.target.closest("[data-del]"); if (del) { reg.splice(+del.dataset.del, 1); save(); root.querySelector(".q-reg").innerHTML = regHtml(); }
    });
    drawAll(); syncForm();
  }

  UI.views.cereri = { init, render() { drawLive(false); } };
})();
