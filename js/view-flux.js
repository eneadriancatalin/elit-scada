// ELIT SCADA - vedere "Flux informațional" (maparea legăturilor structurale ale Departamentului Tehnic)
(function () {
  const E = window.ELIT;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NICE = {
    "Planificare si Supply Chain": "Planificare și Supply Chain",
    "Productie": "Producție",
    "Calitate si Siguranta Alimentara": "Calitate și Siguranță Alimentară",
    "Achizitii": "Achiziții",
    "Resurse Umane": "Resurse Umane",
    "Conducere Generala": "Conducere Generală"
  };
  const nice = d => NICE[d] || d;
  // eticheta scurtă pe săgeata de ieșire (când nu există cod TEH explicit)
  const OUTTAG = {
    "Calitate si Siguranta Alimentara": "CCP · calibrări",
    "SSM": "ISCIR · NH3",
    "Achizitii": "Necesar piese"
  };
  const IN_C = "var(--accent)", OUT_C = "var(--text)";

  let root, els = {}, sel = null, deps = [];

  const CSS = `
  .f-note { color: var(--muted); font-size: 12px; margin: 8px 0 0; }
  .f-wrap { display: grid; gap: 14px; min-width: 0; }
  .f-intro { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center; }
  .f-intro h2 { margin: 0 0 4px; font-size: 16px; font-weight: 600; letter-spacing: -.01em; }
  .f-intro p { margin: 0; color: var(--muted); max-width: 900px; }
  .f-intro p b { color: var(--text); font-weight: 500; }
  .f-counts { display: flex; gap: 8px; flex-wrap: wrap; }
  .f-counts div { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 4px 12px; text-align: center; min-width: 84px; }
  .f-counts span { display: block; font-size: 11px; color: var(--muted); }
  .f-counts b { font-family: var(--mono); font-weight: 500; font-size: 16px; }
  .f-main { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 14px; align-items: start; }
  .f-diag { min-width: 0; }
  .f-flow { display: grid; grid-template-columns: minmax(0, 1fr) 210px minmax(0, 1fr); align-items: stretch; }
  .f-col { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .f-colh { font-size: 12px; color: var(--muted); margin: 0 0 2px; display: flex; align-items: center; gap: 6px; }
  .f-colh i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; }
  .f-col.in .f-colh { padding-right: 40px; } .f-col.out .f-colh { padding-left: 40px; }
  .f-row { display: grid; align-items: center; cursor: pointer; transition: opacity .15s; }
  .f-row:focus { outline: none; } .f-row:focus-visible .f-box { border-color: var(--accent); }
  .f-col.in .f-row { grid-template-columns: minmax(0, 1fr) 40px; }
  .f-col.out .f-row { grid-template-columns: 40px minmax(0, 1fr); }
  .f-box { border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); padding: 8px 10px; min-width: 0; transition: border-color .15s, background .15s; }
  .f-box .f-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .f-box .f-dn { font-size: 14px; font-weight: 500; }
  .f-box .f-inf { font-size: 13px; color: var(--muted); margin-top: 2px; overflow-wrap: anywhere; }
  .f-chip { font-family: var(--mono); font-size: 12px; font-weight: 500; padding: 0 6px; border-radius: 4px; border: 1px solid var(--line); white-space: nowrap; }
  .f-col.in .f-chip { color: ${IN_C}; border-color: ${IN_C}; }
  .f-chip.live { color: var(--ok); border-color: var(--ok); }
  .f-conn { position: relative; height: 0; border-top: 1.5px solid; }
  .f-conn::after { content: ""; position: absolute; right: -1px; top: -6px; border-style: solid; border-width: 5px 0 5px 7px; border-color: transparent transparent transparent currentColor; }
  .f-col.in .f-conn { color: ${IN_C}; border-top-color: ${IN_C}; }
  .f-col.out .f-conn { color: ${OUT_C}; border-top-color: ${OUT_C}; }
  .f-row:hover .f-box, .f-row.f-on .f-box { border-color: var(--text); background: var(--panel2); }
  .f-flow.f-has-sel .f-row:not(.f-on) { opacity: .35; }
  .f-core { border: 1px solid var(--text); border-radius: var(--radius); background: var(--text); color: var(--panel); padding: 16px 14px; display: flex; flex-direction: column; justify-content: center; gap: 12px; text-align: center; margin-top: 22px; }
  .f-core h4 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -.01em; }
  .f-core .f-cs { font-size: 12px; opacity: .7; }
  .f-core .f-cl { font-family: var(--mono); font-size: 12px; display: grid; gap: 4px; }
  .f-core .f-cl span { border: 1px solid color-mix(in srgb, var(--panel) 30%, transparent); border-radius: 4px; padding: 2px 6px; }
  .f-core .f-kv { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .f-core .f-kv div { border-top: 1px solid color-mix(in srgb, var(--panel) 30%, transparent); padding-top: 6px; }
  .f-core .f-kv small { display: block; font-size: 11px; opacity: .7; }
  .f-core .f-kv b { font-family: var(--mono); font-weight: 500; font-size: 16px; }
  .f-down { display: none; text-align: center; color: var(--muted); font-size: 18px; line-height: 1; padding: 8px 0; }
  .f-card { min-width: 0; }
  .f-card h4 { margin: 0 0 2px; font-size: 14px; font-weight: 600; }
  .f-card .f-hint { color: var(--muted); font-size: 12.5px; margin: 0 0 10px; }
  .f-card .f-blk { border: 1px solid var(--line); border-left: 2px solid; padding: 6px 10px; margin: 8px 0; background: var(--panel); border-radius: var(--radius); font-size: 13px; }
  .f-card .f-blk.in { border-color: ${IN_C}; } .f-card .f-blk.out { border-color: ${OUT_C}; }
  .f-card .f-blk span { display: block; font-size: 11px; color: var(--muted); }
  .f-card .f-blk b { font-family: var(--mono); font-weight: 500; }
  .f-card .f-blk.in b { color: ${IN_C}; } .f-card .f-blk.out b { color: ${OUT_C}; }
  .f-card .f-none { color: var(--muted); font-style: italic; }
  .f-card .f-live { margin-top: 10px; font-size: 12.5px; color: var(--muted); }
  .f-card .f-live b { color: var(--text); font-weight: 500; font-family: var(--mono); }
  .f-card button { margin-top: 8px; }
  .f-tables { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
  .f-tbl td { overflow-wrap: anywhere; }
  .f-tbl .f-code { font-family: var(--mono); font-weight: 500; white-space: nowrap; }
  .f-tbl.in .f-code { color: ${IN_C}; } .f-tbl.out .f-code, .f-tbl.liv .f-code { color: ${OUT_C}; }
  .f-tbl tbody tr { cursor: default; }
  .f-tbl tbody tr[data-dep] { cursor: pointer; }
  .f-tbl tbody tr:hover { background: var(--panel2); }
  .f-tbl tr.f-on { background: var(--panel2); box-shadow: inset 2px 0 0 var(--accent); }
  .f-src { display: inline-block; font-size: 11px; padding: 0 6px; border-radius: 4px; border: 1px solid var(--line); color: var(--muted); margin-left: 6px; font-family: var(--mono); }
  .f-tblw { overflow-x: auto; }
  @media (max-width: 1200px) { .f-main { grid-template-columns: minmax(0, 1fr); } .f-tables { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 700px) {
    .f-intro { grid-template-columns: minmax(0, 1fr); }
    .f-flow { grid-template-columns: minmax(0, 1fr); }
    .f-col.in .f-row, .f-col.out .f-row { grid-template-columns: minmax(0, 1fr); }
    .f-conn { display: none; }
    .f-col.in .f-colh, .f-col.out .f-colh { padding: 0; }
    .f-core { margin-top: 0; }
    .f-down { display: block; }
    .f-tbl thead { display: none; }
    .f-tbl, .f-tbl tbody, .f-tbl tr, .f-tbl td { display: block; width: 100%; }
    .f-tbl tr { border: 1px solid var(--line); border-radius: 8px; margin-bottom: 8px; padding: 6px 10px; }
    .f-tbl td { border: none; padding: 2px 0; }
    .f-tbl td[data-l]::before { content: attr(data-l) ": "; color: var(--muted); font-size: 12px; }
  }`;

  function collectDeps() {
    const F = E.data.fluxuri, names = [];
    (E.data.departamente || []).forEach(n => names.push(n));
    [...F.catreTEH, ...F.dinTEH].forEach(f => { if (!names.includes(f.dep)) names.push(f.dep); });
    return names.map(n => ({
      name: n,
      ins: F.catreTEH.filter(f => f.dep === n),
      outs: F.dinTEH.filter(f => f.dep === n)
    }));
  }
  const tehCode = s => (String(s).match(/TEH\s*\d{3}/) || [null])[0];
  const isLive = d => d.name === "Producție" || d.name === "Director General";

  // eticheta pentru un flux de ieșire: valoare live, tag din date sau cod TEH
  function outChip(f) {
    if (f.rapid && f.dep === "Director General") return { t: "OEE " + UI.pct(E.kpi().oee), live: true };
    if (f.rapid && f.dep === "Vânzări") return { t: Math.round(E.capacity().rate).toLocaleString("ro-RO") + " kg/h", live: true };
    if (f.rapid && f.dep === "Logistică") return { t: E.byId.DEP01.values.temp.toFixed(1) + " °C", live: true };
    return { t: f.tag || tehCode(f.info) || OUTTAG[f.dep] || "TEH", live: false };
  }

  function buildFlow() {
    const F = E.data.fluxuri, k = E.kpi();
    const ins = F.catreTEH.map(f => `
      <div class="f-row" data-dep="${esc(f.dep)}" tabindex="0" role="button">
        <div class="f-box"><div class="f-top"><span class="f-dn">${esc(nice(f.dep))}</span><span class="f-chip">${esc(f.cod)}</span></div>
        <div class="f-inf">${esc(f.info)}</div></div>
        <div class="f-conn" aria-hidden="true"></div>
      </div>`).join("");
    const outs = F.dinTEH.map((f, i) => {
      const c = outChip(f);
      return `
      <div class="f-row" data-dep="${esc(f.dep)}" tabindex="0" role="button">
        <div class="f-conn" aria-hidden="true"></div>
        <div class="f-box"><div class="f-top"><span class="f-dn">${esc(nice(f.dep))}</span><span class="f-chip${c.live ? " live" : ""}" data-out="${i}">${esc(c.t)}</span></div>
        <div class="f-inf">${esc(f.info)}</div></div>
      </div>`;
    }).join("");
    els.diag.innerHTML = `<div class="f-flow">
      <div class="f-col in"><div class="f-colh"><i style="background:${IN_C}"></i>Ce primim · ${F.catreTEH.length} fluxuri</div>${ins}</div>
      <div class="f-down" aria-hidden="true">↓</div>
      <div class="f-core">
        <h4>Departament Tehnic</h4>
        <div class="f-cs">Mentenanță · platforma SCADA</div>
        <div class="f-cl"><span>${E.data.livrabileTEH.length} livrabile · TEH 001–${E.data.livrabileTEH[E.data.livrabileTEH.length - 1].cod.slice(4)}</span></div>
        <div class="f-kv">
          <div><small>Disponibilitate</small><b data-live="avail">${UI.pct(k.availability)}</b></div>
          <div><small>OEE</small><b data-live="oee">${UI.pct(k.oee)}</b></div>
        </div>
        <div class="f-cs">live din SCADA</div>
      </div>
      <div class="f-down" aria-hidden="true">↓</div>
      <div class="f-col out"><div class="f-colh"><i style="background:${OUT_C}"></i>Ce oferim · ${F.dinTEH.length} fluxuri</div>${outs}</div>
    </div>`;
    els.flow = els.diag.querySelector(".f-flow");
    els.outChips = [...els.flow.querySelectorAll("[data-out]")];
    const fl = els.flow;
    const pick = name => { sel = sel === name ? null : name; highlight(sel); };
    fl.addEventListener("mouseover", ev => { const r = ev.target.closest(".f-row"); if (r) highlight(r.dataset.dep); });
    fl.addEventListener("mouseleave", () => highlight(sel));
    fl.addEventListener("click", ev => { const r = ev.target.closest(".f-row"); if (r) pick(r.dataset.dep); });
    fl.addEventListener("keydown", ev => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      const r = ev.target.closest(".f-row"); if (!r) return; ev.preventDefault(); pick(r.dataset.dep);
    });
    fl.addEventListener("focusin", ev => { const r = ev.target.closest(".f-row"); if (r) highlight(r.dataset.dep); });
    highlight(sel);
  }

  function highlight(name) {
    if (!els.flow) return;
    els.flow.classList.toggle("f-has-sel", !!name);
    els.flow.querySelectorAll(".f-row").forEach(g => g.classList.toggle("f-on", g.dataset.dep === name));
    root.querySelectorAll(".f-tbl tr[data-dep]").forEach(r => r.classList.toggle("f-on", r.dataset.dep === name));
    renderCard(name);
  }

  function renderCard(name) {
    const d = deps.find(x => x.name === name);
    if (!d) {
      const k = E.kpi();
      els.card.innerHTML = `<h4>Departament Tehnic</h4>
        <p class="f-hint">Treceți cu mouse-ul sau apăsați pe un departament pentru a vedea ce informații schimbă cu noi.</p>
        <div class="f-blk in"><span>Primim (intrări)</span>${E.data.fluxuri.catreTEH.length} fluxuri de la ${new Set(E.data.fluxuri.catreTEH.map(f => f.dep)).size} departamente</div>
        <div class="f-blk out"><span>Oferim (ieșiri)</span>${E.data.fluxuri.dinTEH.length} fluxuri către ${new Set(E.data.fluxuri.dinTEH.map(f => f.dep)).size} departamente</div>
        <div class="f-blk out"><span>Livrabile proprii</span>${E.data.livrabileTEH.length} livrabile (TEH 001–026), ${E.data.livrabileTEH.filter(l => l.dep).length} către departamentele din joc</div>
        <div class="f-live">Live din SCADA: disponibilitate <b data-live="avail">${UI.pct(k.availability)}</b> · OEE <b data-live="oee">${UI.pct(k.oee)}</b></div>`;
      return;
    }
    const k = E.kpi();
    els.card.innerHTML = `<h4>${esc(nice(d.name))}</h4>
      <p class="f-hint">Legătură structurală cu Departamentul Tehnic</p>
      <div class="f-blk in"><span>Ne trimite (intrare)</span>${d.ins.length ? d.ins.map(f => `<div><b>${esc(f.cod)}</b> – ${esc(f.info)}</div>`).join("") : `<div class="f-none">Nu ne trimite informații formalizate.</div>`}</div>
      <div class="f-blk out"><span>Primește de la noi (ieșire)</span>${d.outs.length ? d.outs.map(f => `<div><b>${esc(f.tag)}</b> – ${esc(f.info)}</div>`).join("") : `<div class="f-none">Nu primește informații de la noi.</div>`}</div>
      ${isLive(d) ? `<div class="f-live">Valoare live transmisă: ${d.name === "Producție" ? `disponibilitate <b data-live="avail">${UI.pct(k.availability)}</b> (${k.run}/${k.total} utilaje)` : `OEE <b data-live="oee">${UI.pct(k.oee)}</b> · disponibilitate <b data-live="avail">${UI.pct(k.availability)}</b>`}</div>` : ""}
      ${sel === d.name ? `<button data-clear>Deselectează</button>` : ""}`;
    const b = els.card.querySelector("[data-clear]"); if (b) b.onclick = () => { sel = null; highlight(null); };
  }

  function row(cells, dep) {
    return `<tr${dep ? ` data-dep="${esc(dep)}"` : ""}>${cells.map(([l, v, cls]) => `<td data-l="${esc(l)}"${cls ? ` class="${cls}"` : ""}>${v}</td>`).join("")}</tr>`;
  }

  function init(r) {
    root = r;
    if (!document.getElementById("f-style")) {
      const st = document.createElement("style"); st.id = "f-style"; st.textContent = CSS; document.head.appendChild(st);
    }
    deps = collectDeps();
    const F = E.data.fluxuri, L = E.data.livrabileTEH;
    root.innerHTML = `
    <div class="f-wrap">
      <div class="panel f-intro">
        <div>
          <h2>Flux informațional – Departamentul Tehnic</h2>
          <p>Harta legăturilor structurale: ce informații <b>primim</b> de la celelalte departamente și ce <b>oferim</b> noi.
          Codurile sunt cele din documentele de mapare ELIT Tehnic (Opis Codificare Livrabile, Maparea Legăturilor – Input).
          <b>SCADA-ul este sursa de date pentru livrabilele TEH</b>, iar celelalte departamente primesc informația live, direct din platformă.</p>
          <p class="f-note">În joc: Planificare și Supply Chain → Producție, Distribuție → Logistică, Financiar → Contabilitate. Din documente, fără departament în joc: ${esc(E.data.inafaraJoc.departamente.join(", "))}.</p>
        </div>
        <div class="f-counts">
          <div><span>Departamente</span><b>${deps.length}</b></div>
          <div><span>Intrări</span><b style="color:${IN_C}">${F.catreTEH.length}</b></div>
          <div><span>Ieșiri</span><b style="color:${OUT_C}">${F.dinTEH.length}</b></div>
          <div><span>Livrabile</span><b>${L.length}</b></div>
        </div>
      </div>
      <div class="f-main">
        <div class="panel f-diag">
          <div class="f-svg"></div>
        </div>
        <div class="panel f-card"></div>
      </div>
      <div class="panel">
        <h3>Livrabilele Departamentului Tehnic</h3>
        <div class="f-tblw"><table class="f-tbl liv">
          <thead><tr><th>Cod</th><th>Destinatar (document)</th><th>Livrabil</th><th>Tip</th><th>Format</th><th>Rezoluție</th><th>Periodicitate</th><th>Timp reacție</th></tr></thead>
          <tbody>${L.map(l => row([["Cod", esc(l.cod), "f-code"], ["Destinatar", esc(l.post) + (l.dep && l.dep !== l.post ? `<span class="f-src">în joc: ${esc(l.dep)}</span>` : l.dep ? "" : `<span class="f-src">nu e în joc</span>`)], ["Livrabil", esc(l.livrabil)], ["Tip", esc(l.timing)], ["Format", esc(l.format)], ["Rezoluție", esc(l.rezolutie)], ["Periodicitate", esc(l.periodicitate)], ["Timp reacție", esc(l.reactie)]], l.dep || "")).join("")}</tbody>
        </table></div>
      </div>
      <div class="f-tables">
        <div class="panel">
          <h3>Ce primim</h3>
          <div class="f-tblw"><table class="f-tbl in">
            <thead><tr><th>Departament</th><th>Cod</th><th>Informație</th><th>Post furnizor</th><th>Periodicitate</th></tr></thead>
            <tbody>${F.catreTEH.map(f => row([["Departament", esc(nice(f.dep))], ["Cod", esc(f.cod), "f-code"], ["Informație", esc(f.info)], ["Post furnizor", esc(f.post)], ["Periodicitate", esc(f.periodicitate) + " · " + esc(f.reactie)]], f.dep)).join("")}</tbody>
          </table></div>
        </div>
        <div class="panel">
          <h3>Ce oferim</h3>
          <div class="f-tblw"><table class="f-tbl out">
            <thead><tr><th>Departament</th><th>Livrabil</th><th>Informație</th></tr></thead>
            <tbody>${F.dinTEH.map(f => {
              return row([["Departament", esc(nice(f.dep))], ["Livrabil", esc(f.tag), "f-code"], ["Informație", esc(f.info) + (f.rapid ? `<span class="f-src">răspuns rapid SCADA</span>` : "")]], f.dep);
            }).join("")}</tbody>
          </table></div>
        </div>
      </div>
    </div>`;
    els.diag = root.querySelector(".f-svg");
    els.card = root.querySelector(".f-card");
    root.querySelectorAll(".f-tbl tr[data-dep]").forEach(tr => tr.onclick = () => {
      sel = sel === tr.dataset.dep ? null : tr.dataset.dep; highlight(sel);
      if (sel && window.innerWidth < 1000) els.diag.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    buildFlow();
  }

  let lastLive = 0;
  function render() {
    if (!root || !els.flow) return;
    if (Date.now() - lastLive < 2000) return; // actualizări live ușoare, la 2 s
    lastLive = Date.now();
    const k = E.kpi();
    els.outChips.forEach(c => { const f = E.data.fluxuri.dinTEH[+c.dataset.out], o = f && outChip(f); if (o && o.live) c.textContent = o.t; });
    root.querySelectorAll("[data-live=avail]").forEach(b => b.textContent = UI.pct(k.availability));
    root.querySelectorAll("[data-live=oee]").forEach(b => b.textContent = UI.pct(k.oee));
  }

  UI.views.flux = { init, render };
})();
