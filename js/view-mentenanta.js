// ELIT SCADA - vedere "Mentenanță & KPI" (livrabile TEH 001, TEH 003, TEH 019)
(function () {
  const E = window.ELIT;
  const DAY = 864e5;
  const TARIF = 0.85; // lei/kWh - ipoteză demo pentru costul estimativ al energiei
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const isProd = e => !["Z7", "Z8"].includes(e.zone);
  const oeeOf = e => e.oee.a * e.oee.p * e.oee.q;
  const avg = (a, f) => a.length ? a.reduce((s, x) => s + f(x), 0) / a.length : 0;
  const lvl = v => v >= 0.85 ? "ok" : v >= 0.65 ? "warn" : "crit";
  const zoneName = id => (E.data.zones.find(z => z.id === id) || {}).name || id;
  const n0 = v => Math.round(v).toLocaleString("ro-RO");
  const n1 = v => v.toLocaleString("ro-RO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // ---- energie: integrare putere PT01 pe fiecare tick (1 tick = 1 minut simulat)
  const t0 = new Date();
  const minToday = t0.getHours() * 60 + t0.getMinutes();
  let energyToday = minToday * 1380 / 60; // bază plauzibilă: ~1380 kW medii de la miezul nopții
  E.on("tick", () => { energyToday += E.byId.PT01.values.putere / 60; });

  let root, els = {}, lastTable = 0, dirty = true;

  const CSS = `
  .m-wrap { display: grid; gap: 14px; min-width: 0; }
  .m-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .m-head h2 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -.01em; }
  .m-head p { margin: 2px 0 0; color: var(--muted); font-size: 13px; }
  .m-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .m-actions button b { font-family: var(--mono); font-weight: 500; margin-right: 6px; }
  .m-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
  .m-tile { position: relative; overflow: hidden; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 14px; min-width: 0; }
  .m-tile.warn b { color: var(--warn); } .m-tile.crit b { color: var(--crit); }
  .m-tile span { display: block; color: var(--muted); font-size: 12px; }
  .m-tile b { display: block; font-family: var(--mono); font-variant-numeric: tabular-nums; font-size: 22px; font-weight: 500; letter-spacing: -.02em; line-height: 1.2; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .m-tile b small { font-size: 13px; color: var(--muted); margin-left: 3px; font-weight: 500; }
  .m-tile em { display: block; font-style: normal; color: var(--muted); font-size: 12px; margin-top: 2px; }
  .m-two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
  .m-panel { min-width: 0; }
  .m-panel h3 { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .m-panel h3 small { text-transform: none; letter-spacing: 0; font-weight: 400; font-size: 12px; }
  .m-bars { display: grid; gap: 7px; }
  .m-bar { display: grid; grid-template-columns: minmax(70px, 150px) minmax(0, 1fr) 54px; align-items: center; gap: 10px; font-size: 12.5px; cursor: default; }
  .m-bar .m-nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .m-bar .m-nm i { font-style: normal; font-family: var(--mono); color: var(--muted); margin-right: 5px; }
  .m-track { position: relative; height: 8px; background: var(--panel2); border-radius: 4px; overflow: hidden; }
  .m-fill { position: absolute; inset: 0 auto 0 0; border-radius: 4px; transition: width .6s ease; background: var(--text); }
  .m-fill.ok { background: var(--text); } .m-fill.warn { background: var(--warn); } .m-fill.crit { background: var(--crit); }
  .m-track .m-tgt { position: absolute; top: -1px; bottom: -1px; left: 85%; border-left: 1px solid var(--muted); }
  .m-bar .m-v { font-family: var(--mono); text-align: right; font-variant-numeric: tabular-nums; }
  .m-bar.st-off .m-nm { color: var(--muted); }
  .m-legend { display: flex; gap: 14px; flex-wrap: wrap; color: var(--muted); font-size: 12px; margin-top: 10px; }
  .m-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; vertical-align: -1px; }
  .m-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 8px; }
  .m-stats div { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 5px 8px; min-width: 0; }
  .m-stats span { display: block; font-size: 11px; color: var(--muted); }
  .m-stats b { font-family: var(--mono); font-weight: 500; font-size: 14px; white-space: nowrap; }
  .m-chart svg { display: block; width: 100%; height: auto; }
  .m-chart .gl { stroke: var(--line); stroke-width: 1; }
  .m-chart .ax { fill: var(--muted); font: 11px var(--mono); }
  .m-chart .ln { fill: none; stroke: var(--accent); stroke-width: 1.5; stroke-linejoin: round; }
  .m-chart .pt { fill: var(--accent); stroke: var(--panel); stroke-width: 2; }
  .m-tbl td, .m-tbl th { white-space: nowrap; }
  .m-tbl td.m-eq { white-space: normal; }
  .m-tbl td.m-eq b { font-family: var(--mono); font-weight: 500; margin-right: 6px; }
  .m-tbl tbody tr:hover { background: var(--panel2); }
  .m-days { font-family: var(--mono); font-weight: 500; }
  .m-days.crit { color: var(--crit); } .m-days.warn { color: var(--warn); } .m-days.ok { color: var(--text); }
  .m-tbl button { padding: 5px 10px; font-size: 12.5px; white-space: nowrap; }
  .m-note { color: var(--muted); font-size: 12px; margin: 10px 0 0; }
  /* raport tipăribil */
  .m-modal { position: fixed; inset: 0; z-index: 90; background: color-mix(in srgb, var(--bg) 85%, transparent); display: flex; justify-content: center; align-items: flex-start; padding: 24px 16px; overflow-y: auto; }
  .m-sheet { background: var(--panel); color: var(--text); width: 100%; max-width: 860px; border: 1px solid var(--line); border-radius: var(--radius); padding: 28px 32px; font: 13px/1.45 var(--font); }
  .m-sheet .m-bar-top { display: flex; justify-content: flex-end; gap: 8px; margin: -10px -14px 12px 0; }
  .m-rh { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--text); padding-bottom: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .m-rh h1 { font-size: 17px; font-weight: 600; letter-spacing: -.01em; margin: 0 0 4px; }
  .m-rh .m-code { display: inline-block; border: 1px solid var(--line); font-family: var(--mono); font-weight: 500; padding: 0 6px; border-radius: 4px; margin-right: 8px; font-size: 12px; }
  .m-rh .m-meta { font-size: 12px; color: var(--muted); text-align: right; }
  .m-sheet h4 { margin: 18px 0 6px; font-size: 13px; font-weight: 600; }
  .m-sum { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
  .m-sum div { border: 1px solid var(--line); border-radius: var(--radius); padding: 6px 10px; }
  .m-sum span { display: block; font-size: 11px; color: var(--muted); }
  .m-sum b { font-size: 16px; font-weight: 500; font-family: var(--mono); }
  .m-sheet table { font-size: 12px; }
  .m-sheet th { color: var(--muted); background: var(--panel2); }
  .m-sheet th, .m-sheet td { border-bottom: 1px solid var(--line); padding: 5px 8px; }
  .m-sheet .r { text-align: right; font-family: var(--mono); }
  .m-sheet .m-sign { display: flex; justify-content: space-between; gap: 20px; margin-top: 28px; font-size: 12px; color: var(--muted); flex-wrap: wrap; }
  .m-sheet .m-sign div { border-top: 1px solid var(--muted); padding-top: 4px; min-width: 200px; }
  .m-sheet .m-foot { margin-top: 16px; font-size: 11px; color: var(--muted); }
  .m-tblw { overflow-x: auto; }
  @media print {
    body.m-printing > *:not(.m-modal) { display: none !important; }
    body.m-printing { background: var(--panel); }
    .m-modal { position: static; background: none; padding: 0; overflow: visible; display: block; }
    .m-sheet { border: none; max-width: none; padding: 0; border-radius: 0; }
    .m-noprint { display: none !important; }
  }
  @media (max-width: 900px) { .m-two { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 700px) {
    .m-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .m-tile b { font-size: 20px; }
    .m-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .m-bar { grid-template-columns: minmax(0, 92px) minmax(0, 1fr) 48px; gap: 6px; }
    .m-bar .m-nm i { display: none; }
    .m-tbl thead { display: none; }
    .m-tbl, .m-tbl tbody, .m-tbl tr, .m-tbl td { display: block; width: 100%; }
    .m-tbl tr { border: 1px solid var(--line); border-radius: 8px; margin-bottom: 8px; padding: 6px 10px; }
    .m-tbl td { border: none; padding: 3px 0; display: flex; justify-content: space-between; gap: 10px; white-space: normal; }
    .m-tbl td::before { content: attr(data-l); color: var(--muted); font-size: 12px; }
    .m-tbl td.m-eq { display: block; font-weight: 600; } .m-tbl td.m-eq::before { content: none; }
    .m-sheet { padding: 18px 16px; }
    .m-rh .m-meta { text-align: left; }
  }`;

  function tile(key, label, cls = "") {
    return `<div class="m-tile ${cls}" data-t="${key}"><span>${label}</span><b>–</b><em>&nbsp;</em></div>`;
  }

  function init(r) {
    root = r;
    if (!document.getElementById("m-style")) {
      const st = document.createElement("style"); st.id = "m-style"; st.textContent = CSS; document.head.appendChild(st);
    }
    const prod = E.equipment.filter(isProd);
    root.innerHTML = `
    <div class="m-wrap">
      <div class="m-head">
        <div><h2>Mentenanță & KPI tehnici</h2><p>Date tehnice – sursă pentru livrabilele TEH 001 (raport lunar KPI), TEH 003 (plan mentenanță) și TEH 019 (energie)</p></div>
        <div class="m-actions">
          <button class="primary" data-rep="TEH 019"><b>TEH 019</b>Generează raport energie & opriri</button>
          <button class="primary" data-rep="TEH 001"><b>TEH 001</b>Generează raport lunar KPI</button>
        </div>
      </div>
      <div class="m-tiles">
        ${tile("avail", "Disponibilitate")}
        ${tile("oee", "OEE mediu producție")}
        ${tile("mtbf", "MTBF mediu")}
        ${tile("mttr", "MTTR mediu")}
        ${tile("stops", "Opriri neplanificate (luna)")}
        ${tile("energy", "Consum energie azi")}
      </div>
      <div class="m-two">
        <div class="panel m-panel">
          <h3>OEE pe utilaje de producție <small>A × P × Q · țintă 85%</small></h3>
          <div class="m-bars">${prod.map(e => `
            <div class="m-bar" data-id="${e.id}">
              <div class="m-nm"><i>${e.id}</i>${esc(e.name)}</div>
              <div class="m-track"><div class="m-fill"></div><div class="m-tgt"></div></div>
              <div class="m-v">–</div>
            </div>`).join("")}
          </div>
          <div class="m-legend"><span><i style="background:var(--text)"></i>≥ 85% clasă mondială</span><span><i style="background:var(--warn)"></i>65–85%</span><span><i style="background:var(--crit)"></i>&lt; 65%</span></div>
        </div>
        <div class="panel m-panel">
          <h3>Putere absorbită – PT01 <small>ultimele 120 min</small></h3>
          <div class="m-stats">
            <div><span>Acum</span><b data-s="now">–</b></div>
            <div><span>Medie</span><b data-s="avg">–</b></div>
            <div><span>Minim</span><b data-s="min">–</b></div>
            <div><span>Maxim</span><b data-s="max">–</b></div>
          </div>
          <div class="m-chart"></div>
        </div>
      </div>
      <div class="panel m-panel">
        <h3><span>Plan mentenanță preventivă · TEH 003</span><small>către Producție · săptămânal · ordonat după scadență</small></h3>
        <div class="m-tblw"><table class="m-tbl">
          <thead><tr><th>Utilaj</th><th>Stare</th><th>Ultima mentenanță</th><th>Următoarea</th><th>Zile rămase</th><th>Ore funcționare</th><th>Acțiune</th></tr></thead>
          <tbody></tbody>
        </table></div>
        <p class="m-note">Roșu: sub 3 zile (sau depășit) · Galben: sub 7 zile. „Programează acum” trece utilajul în mentenanță; „Finalizează” resetează intervalul la 30 de zile.</p>
      </div>
    </div>`;
    els.tiles = Object.fromEntries([...root.querySelectorAll(".m-tile")].map(t => [t.dataset.t, t]));
    els.bars = [...root.querySelectorAll(".m-bar")].map(b => ({ row: b, eq: E.byId[b.dataset.id], fill: b.querySelector(".m-fill"), v: b.querySelector(".m-v") }));
    els.stats = Object.fromEntries([...root.querySelectorAll("[data-s]")].map(s => [s.dataset.s, s]));
    els.chart = root.querySelector(".m-chart");
    els.tbody = root.querySelector(".m-tbl tbody");

    els.tbody.addEventListener("click", ev => {
      const b = ev.target.closest("button[data-act]"); if (!b) return;
      const act = b.dataset.act;
      UI.run(b.dataset.id, act, act === "maint" ? "Mentenanță preventivă" : undefined);
    });
    root.querySelectorAll("[data-rep]").forEach(b => b.onclick = () => openReport(b.dataset.rep));
    E.on("change", () => { dirty = true; if (UI.current === "mentenanta") render(); });
    render();
  }

  function setTile(key, html, sub, cls) {
    const t = els.tiles[key]; if (!t) return;
    t.querySelector("b").innerHTML = html;
    t.querySelector("em").textContent = sub;
    t.className = "m-tile " + (cls || "");
  }

  function render() {
    if (!root || !els.tbody) return;
    const k = E.kpi();
    const eqs = E.equipment;
    const mtbf = avg(eqs, e => e.mtbf), mttr = avg(eqs, e => e.mttr);
    const stops = eqs.reduce((s, e) => s + e.stops, 0);
    const prod = eqs.filter(isProd);
    setTile("avail", (k.availability * 100).toFixed(1) + "<small>%</small>", `${k.run}/${k.total} în funcțiune · ${k.fault} defect · ${k.maint} mentenanță`, lvl(k.availability));
    setTile("oee", (k.oee * 100).toFixed(1) + "<small>%</small>", `${prod.length} utilaje producție · țintă 85%`, lvl(k.oee));
    setTile("mtbf", n0(mtbf) + "<small>h</small>", "timp mediu între defecte", "");
    setTile("mttr", n1(mttr) + "<small>h</small>", "timp mediu de reparație", mttr > 3 ? "warn" : "ok");
    setTile("stops", String(stops), `${eqs.filter(e => e.stops).length} utilaje afectate`, stops > 40 ? "crit" : stops > 25 ? "warn" : "");
    setTile("energy", n0(energyToday) + "<small>kWh</small>", `acum ${n0(k.power)} kW · cos φ ${E.byId.PT01.values.cosfi.toFixed(2)}`, "");

    for (const b of els.bars) {
      const o = oeeOf(b.eq), l = lvl(o);
      b.fill.style.width = (o * 100).toFixed(1) + "%";
      b.fill.className = "m-fill " + l;
      b.v.textContent = (o * 100).toFixed(1) + "%";
      b.v.className = "m-v lv-" + l;
      b.row.classList.toggle("st-off", b.eq.status !== "run");
      b.row.title = `${b.eq.id} – ${b.eq.name}\nStare: ${UI.statusLabel[b.eq.status]}\nDisponibilitate (A): ${UI.pct(b.eq.oee.a)}\nPerformanță (P): ${UI.pct(b.eq.oee.p)}\nCalitate (Q): ${UI.pct(b.eq.oee.q)}\nOEE = A × P × Q = ${UI.pct(o)}`;
    }

    renderChart();

    if (dirty || Date.now() - lastTable > 5000) renderTable();
  }

  function renderChart() {
    const h = E.byId.PT01.history.putere;
    if (!h.length) return;
    const mn = Math.min(...h), mx = Math.max(...h), av = h.reduce((s, v) => s + v, 0) / h.length;
    els.stats.now.textContent = n0(h[h.length - 1]) + " kW";
    els.stats.avg.textContent = n0(av) + " kW";
    els.stats.min.textContent = n0(mn) + " kW";
    els.stats.max.textContent = n0(mx) + " kW";
    const W = 600, H = 220, L = 50, R = 12, T = 10, B = 26;
    let lo = Math.floor((mn - 40) / 100) * 100, hi = Math.ceil((mx + 40) / 100) * 100;
    if (lo < 0) lo = 0; if (hi - lo < 200) hi = lo + 200;
    const N = 120;
    const x = i => L + (W - L - R) * (i + (N - h.length)) / (N - 1);
    const y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    const pts = h.map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
    let grid = "";
    for (let g = 0; g <= 4; g++) {
      const v = lo + (hi - lo) * g / 4, yy = y(v).toFixed(1);
      grid += `<line class="gl" x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/><text class="ax" x="${L - 6}" y="${+yy + 4}" text-anchor="end">${Math.round(v)}</text>`;
    }
    const xl = [[0, "−120 min"], [60, "−60 min"], [119, "acum"]].map(([i, t]) =>
      `<text class="ax" x="${L + (W - L - R) * i / (N - 1)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === 119 ? "end" : "middle"}">${t}</text>`).join("");
    const last = x(h.length - 1).toFixed(1);
    els.chart.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Trend putere activă PT01">
      ${grid}${xl}
      <text class="ax" x="${L}" y="${T + 10}" dx="6">kW</text>
      <polyline class="ln" points="${pts}"/>
      <circle class="pt" r="4" cx="${last}" cy="${y(h[h.length - 1]).toFixed(1)}"/>
    </svg>`;
  }

  function daysLeft(e) { return (e.nextMaint - Date.now()) / DAY; }

  function renderTable() {
    dirty = false; lastTable = Date.now();
    const rows = E.equipment.slice().sort((a, b) => a.nextMaint - b.nextMaint);
    els.tbody.innerHTML = rows.map(e => {
      const d = daysLeft(e);
      const cls = d < 3 ? "crit" : d < 7 ? "warn" : "ok";
      const dTxt = d < 0 ? `depășit ${Math.ceil(-d)} z` : d < 1 ? "azi" : Math.floor(d) + " z";
      const btn = e.status === "maint"
        ? `<button class="okbtn" data-act="maintDone" data-id="${e.id}">Finalizează</button>`
        : `<button class="primary" data-act="maint" data-id="${e.id}">Programează acum</button>`;
      return `<tr>
        <td class="m-eq" data-l="Utilaj"><b>${e.id}</b>${esc(e.name)}</td>
        <td data-l="Stare"><span class="pill st-${e.status}">${UI.statusLabel[e.status]}</span></td>
        <td data-l="Ultima mentenanță" class="mono">${UI.date(e.lastMaint)}</td>
        <td data-l="Următoarea" class="mono">${UI.date(e.nextMaint)}</td>
        <td data-l="Zile rămase"><span class="m-days ${cls}">${dTxt}</span></td>
        <td data-l="Ore funcționare" class="mono">${n0(e.runHours)} h</td>
        <td data-l="Acțiune">${btn}</td>
      </tr>`;
    }).join("");
  }

  // ---- rapoarte TEH 019 / TEH 001 (fereastră modală tipăribilă)
  function recipients(code, kw) {
    const f = E.data.fluxuri.dinTEH.filter(x => x.info.includes(code) || (kw && x.info.includes(kw)));
    return f.map(x => x.dep).join(", ") || "Conducere Generală";
  }
  function header(code, title) {
    const L = E.data.livrabileTEH.find(l => l.cod === code) || {};
    const now = new Date();
    return `<div class="m-rh">
      <div><h1><span class="m-code">${code}</span>${esc(title)}</h1>
        <div>ELIT SRL · Departament Tehnic / Mentenanță · ${esc(E.data.site)}</div>
        <div>Emitent: Director Tehnic · Destinatar: ${esc(L.post || "")}</div></div>
      <div class="m-meta">Generat: ${now.toLocaleString("ro-RO")}<br>Utilizator: ${esc(E.user)}<br>Periodicitate: ${esc(L.periodicitate || "")} · Tip: ${esc(L.timing || "")}<br>Format: ${esc(L.format || "")} · Timp reacție: ${esc(L.reactie || "")}</div>
    </div>`;
  }
  const sumBox = (l, v) => `<div><span>${l}</span><b>${v}</b></div>`;
  const signs = code => {
    const L = E.data.livrabileTEH.find(l => l.cod === code) || {};
    return `<div class="m-sign"><div>Întocmit: Departament Tehnic</div><div>Verificat / Aprobat: Director Tehnic</div></div>
    <div class="m-foot">Sursa datelor: platforma SCADA ELIT (simulare didactică). Valorile se recalculează la fiecare generare a raportului.</div>`;
  };

  function report002() {
    const eqs = E.equipment;
    const st = eqs.filter(e => e.stops > 0).sort((a, b) => b.stops - a.stops || b.mttr - a.mttr);
    const stops = eqs.reduce((s, e) => s + e.stops, 0);
    const down = eqs.reduce((s, e) => s + e.stops * e.mttr, 0);
    const h = E.byId.PT01.history.putere;
    const av = h.reduce((s, v) => s + v, 0) / (h.length || 1);
    const defects = E.events.filter(ev => ev.type === "alarm" && /DEFECT/.test(ev.msg)).slice(0, 15);
    return header("TEH 019", "Raport de consum și cost al energiei + opriri neplanificate") + `
      <h4>Sinteză</h4>
      <div class="m-sum">
        ${sumBox("Opriri neplanificate (luna)", stops)}
        ${sumBox("Ore indisponibilitate estimate", n1(down) + " h")}
        ${sumBox("Utilaje în defect acum", eqs.filter(e => e.status === "fault").length)}
        ${sumBox("Consum energie azi", n0(energyToday) + " kWh")}
        ${sumBox("Putere medie (2 h)", n0(av) + " kW")}
        ${sumBox("Putere maximă (2 h)", n0(Math.max(...h)) + " kW")}
        ${sumBox("Cost estimativ energie azi", n0(energyToday * TARIF) + " lei")}
        ${sumBox("Factor de putere", E.byId.PT01.values.cosfi.toFixed(3))}
      </div>
      <h4>Opriri neplanificate pe utilaje</h4>
      <div class="m-tblw"><table><thead><tr><th>Utilaj</th><th>Zonă</th><th class="r">Opriri</th><th class="r">MTTR (h)</th><th class="r">Ore oprire est.</th><th>Stare curentă</th></tr></thead><tbody>
        ${st.map(e => `<tr><td><b>${e.id}</b> ${esc(e.name)}</td><td>${esc(zoneName(e.zone))}</td><td class="r">${e.stops}</td><td class="r">${n1(e.mttr)}</td><td class="r">${n1(e.stops * e.mttr)}</td><td>${UI.statusLabel[e.status]}${e.faultReason ? " – " + esc(e.faultReason) : ""}</td></tr>`).join("") || `<tr><td colspan="6">Nicio oprire neplanificată înregistrată.</td></tr>`}
      </tbody></table></div>
      <h4>Defecte înregistrate în sesiunea curentă</h4>
      <div class="m-tblw"><table><thead><tr><th>Ora</th><th>Utilaj</th><th>Descriere</th></tr></thead><tbody>
        ${defects.map(ev => `<tr><td class="r">${UI.time(ev.time)}</td><td>${esc(ev.eqId || "")}</td><td>${esc(ev.msg)}</td></tr>`).join("") || `<tr><td colspan="3">Niciun defect în sesiunea curentă.</td></tr>`}
      </tbody></table></div>
      <p class="m-foot">Consumul de energie este integrat din puterea activă măsurată la postul trafo PT01 (1 tick = 1 minut simulat). Tarif utilizat pentru estimare: ${TARIF} lei/kWh (ipoteză demo).</p>
      ${signs("TEH 019")}`;
  }

  function report003() {
    const k = E.kpi(), eqs = E.equipment;
    const mtbf = avg(eqs, e => e.mtbf), mttr = avg(eqs, e => e.mttr);
    const ai = mtbf / (mtbf + mttr);
    return header("TEH 001", "Raport lunar de activitate al Departamentului Tehnic (KPI: OEE, MTBF, MTTR, cost)") + `
      <h4>Sinteză</h4>
      <div class="m-sum">
        ${sumBox("Disponibilitate instantanee", UI.pct(k.availability))}
        ${sumBox("Disponibilitate inerentă MTBF/(MTBF+MTTR)", UI.pct(ai))}
        ${sumBox("OEE mediu producție", UI.pct(k.oee))}
        ${sumBox("MTBF mediu", n0(mtbf) + " h")}
        ${sumBox("MTTR mediu", n1(mttr) + " h")}
        ${sumBox("În funcțiune / total", k.run + " / " + k.total)}
        ${sumBox("Oprite · Defect · Mentenanță", `${k.stop} · ${k.fault} · ${k.maint}`)}
        ${sumBox("Alarme active", k.activeAlarms)}
      </div>
      <h4>KPI pe utilaje</h4>
      <div class="m-tblw"><table><thead><tr><th>Utilaj</th><th>Stare</th><th class="r">A</th><th class="r">P</th><th class="r">Q</th><th class="r">OEE</th><th class="r">MTBF (h)</th><th class="r">MTTR (h)</th><th class="r">Ore funcț.</th></tr></thead><tbody>
        ${eqs.map(e => {
          const p = isProd(e);
          return `<tr><td><b>${e.id}</b> ${esc(e.name)}</td><td>${UI.statusLabel[e.status]}</td><td class="r">${UI.pct(e.oee.a)}</td><td class="r">${p ? UI.pct(e.oee.p) : "–"}</td><td class="r">${p ? UI.pct(e.oee.q) : "–"}</td><td class="r">${p ? UI.pct(oeeOf(e)) : "–"}</td><td class="r">${e.mtbf}</td><td class="r">${n1(e.mttr)}</td><td class="r">${n0(e.runHours)}</td></tr>`;
        }).join("")}
      </tbody></table></div>
      <p class="m-foot">OEE = Disponibilitate (A) × Performanță (P) × Calitate (Q), calculat doar pentru utilajele de producție (fără utilități și laborator). Țintă OEE: 85%.</p>
      ${signs("TEH 001")}`;
  }

  function openReport(code) {
    closeReport();
    const m = document.createElement("div");
    m.className = "m-modal"; m.id = "m-modal";
    m.innerHTML = `<div class="m-sheet" role="dialog" aria-modal="true">
      <div class="m-bar-top m-noprint"><button class="primary" data-x="print">Tipărește / Salvează PDF</button><button data-x="close">Închide</button></div>
      ${code === "TEH 019" ? report002() : report003()}
    </div>`;
    m.addEventListener("click", ev => {
      if (ev.target === m) return closeReport();
      const b = ev.target.closest("[data-x]"); if (!b) return;
      if (b.dataset.x === "print") window.print(); else closeReport();
    });
    document.body.appendChild(m);
    document.body.classList.add("m-printing");
    document.addEventListener("keydown", escKey);
    E.log(null, `Generare raport ${code}`, "system");
  }
  function escKey(ev) { if (ev.key === "Escape") closeReport(); }
  function closeReport() {
    const m = document.getElementById("m-modal"); if (m) m.remove();
    document.body.classList.remove("m-printing");
    document.removeEventListener("keydown", escKey);
  }

  UI.views.mentenanta = { init, render };
})();
