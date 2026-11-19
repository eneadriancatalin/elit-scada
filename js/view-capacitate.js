// ELIT SCADA - vedere "Productie & capacitate": raspuns rapid la "cat am produs azi / cat producem pe tura / saptamana"
(function () {
  const E = window.ELIT;
  const KEY = "elit-cap-cfg";
  let root, cfg = { ture: 2, zile: 6 }, els = {};
  const nf = (v, d = 0) => v.toLocaleString("ro-RO", { minimumFractionDigits: d, maximumFractionDigits: d });
  const kgT = kg => kg >= 10000 ? nf(kg / 1000, 1) + " t" : nf(kg) + " kg";
  const NICE = { Racire: "Răcire" };

  const CSS = `
  .p-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
  .p-head h2 { margin: 0; font-size: 20px; font-weight: 600; }
  .p-head p { margin: 4px 0 0; color: var(--muted); max-width: 720px; }
  .p-cfg { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font-size: 13px; color: var(--muted); }
  .p-cfg select { width: auto; }
  .p-answer { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 18px; margin-bottom: 16px; }
  .p-answer .p-q { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px; }
  .p-answer .p-a { font-size: 17px; line-height: 1.6; }
  .p-answer b { font-family: var(--mono); font-weight: 600; }
  .p-answer .p-copy { margin-top: 10px; }
  .p-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
  @media (max-width: 900px) { .p-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .p-tile { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px; min-width: 0; }
  .p-tile span { display: block; font-size: 12px; color: var(--muted); }
  .p-tile b { display: block; font: 600 26px/1.2 var(--mono); margin: 4px 0; font-variant-numeric: tabular-nums; }
  .p-tile small { color: var(--muted); font-size: 12px; }
  .p-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 16px; }
  @media (max-width: 1000px) { .p-grid { grid-template-columns: minmax(0, 1fr); } }
  .p-step { display: grid; grid-template-columns: 130px minmax(0, 1fr) 120px; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid var(--line); font-size: 13px; }
  .p-step:first-of-type { border-top: none; }
  @media (max-width: 520px) { .p-step { grid-template-columns: minmax(0, 1fr) 96px; } .p-bar { grid-column: 1 / -1; grid-row: 2; } }
  .p-step .p-n b { display: block; font-weight: 500; }
  .p-step .p-n small { color: var(--muted); font: 11px var(--mono); }
  .p-bar { position: relative; height: 10px; background: var(--panel2); border-radius: 5px; overflow: hidden; }
  .p-bar i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--text); border-radius: 5px; transition: width .4s; }
  .p-step.bott .p-bar i { background: var(--warn); }
  .p-step .p-v { text-align: right; font-family: var(--mono); font-size: 12px; }
  .p-step .p-v small { display: block; color: var(--muted); }
  .p-tag { display: inline-block; margin-left: 6px; font: 500 10px var(--mono); color: var(--warn); border: 1px solid var(--warn); border-radius: 4px; padding: 0 4px; vertical-align: middle; }
  .p-tbl td, .p-tbl th { text-align: right; } .p-tbl td:first-child, .p-tbl th:first-child { text-align: left; }
  .p-tbl td { font-family: var(--mono); }
  .p-tbl td:first-child { font-family: var(--font); }
  .p-loss { color: var(--crit); }
  .p-note { color: var(--muted); font-size: 12px; margin-top: 10px; }
  `;

  function load() { try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {} }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }

  function calc() {
    const c = E.capacity();
    const nomGood = c.nominal * c.quality;
    const p8 = c.rate * 8, pDay = p8 * cfg.ture, pWeek = pDay * cfg.zile;
    const n8 = nomGood * 8, nDay = n8 * cfg.ture, nWeek = nDay * cfg.zile;
    return { c, p8, pDay, pWeek, n8, nDay, nWeek };
  }

  function answerText(r) {
    const c = r.c;
    return `Astăzi (de la ${String(c.shiftStart).padStart(2, "0")}:00) am produs ${kgT(c.producedToday)}. ` +
      `La capacitatea actuală (${nf(c.rate)} kg/h) producem ${kgT(r.p8)} pe o tură de 8 ore, ${kgT(r.pDay)} pe zi (${cfg.ture} ture) și ${kgT(r.pWeek)} pe săptămână (${cfg.zile} zile). ` +
      `Gâtuirea este la ${NICE[c.bottleneck.name] || c.bottleneck.name}.`;
  }

  function init(r) {
    root = r; load();
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    root.innerHTML = `
      <div class="p-head">
        <div><h2>Producție & capacitate</h2>
        <p>Răspuns rapid la „cât am produs azi?” și „cât producem pe 8 ore / o zi / o săptămână la capacitatea actuală?”. Linia produce cât permite pasul cel mai lent (gâtuirea); utilajele oprite, în defect sau în mentenanță scad capacitatea.</p></div>
        <div class="p-cfg">Ture/zi <select data-k="ture"><option>1</option><option>2</option><option>3</option></select>
          Zile/săpt. <select data-k="zile"><option>5</option><option>6</option><option>7</option></select></div>
      </div>
      <div class="p-answer"><div class="p-q">Răspuns pentru departamentul care întreabă</div><div class="p-a"></div>
        <button class="p-copy">Copiază răspunsul</button></div>
      <div class="p-tiles">
        <div class="p-tile"><span>Produs azi</span><b data-t="today"></b><small data-t="todaySub"></small></div>
        <div class="p-tile"><span>Ritm acum</span><b data-t="rate"></b><small data-t="rateSub"></small></div>
        <div class="p-tile"><span>Pe o tură de 8 ore</span><b data-t="p8"></b><small data-t="p8Sub"></small></div>
        <div class="p-tile"><span>Pe săptămână</span><b data-t="pw"></b><small data-t="pwSub"></small></div>
      </div>
      <div class="p-grid">
        <div class="panel"><h3>Capacitate pe pași – unde e gâtuirea</h3><div class="p-steps"></div>
          <div class="p-note">Bara arată capacitatea actuală față de cea nominală a pasului. Utilajele dintr-un pas lucrează în paralel.</div></div>
        <div class="panel"><h3>Proiecție: actual vs. capacitate maximă</h3>
          <table class="p-tbl"><thead><tr><th>Perioadă</th><th>La ritmul actual</th><th>La capacitate maximă</th><th>Pierdere</th></tr></thead><tbody></tbody></table>
          <div class="p-note">Calcul: ritm (kg/h, produs conform) × ore. Capacitate maximă = toate utilajele în funcțiune la 100%. Valori simulate.</div></div>
      </div>`;
    root.querySelectorAll(".p-cfg select").forEach(s => {
      s.value = cfg[s.dataset.k];
      s.onchange = () => { cfg[s.dataset.k] = +s.value; save(); render(); };
    });
    root.querySelector(".p-copy").onclick = () => {
      const t = answerText(calc());
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => UI.toast("Răspuns copiat"), () => UI.toast("Selectează și copiază textul manual", "err"));
      E.log(null, "Răspuns capacitate producție: " + t, "system");
    };
    els.a = root.querySelector(".p-a"); els.steps = root.querySelector(".p-steps"); els.tb = root.querySelector(".p-tbl tbody");
    render();
  }

  function render() {
    if (!root) return;
    const r = calc(), c = r.c, t = k => root.querySelector(`[data-t="${k}"]`);
    els.a.innerHTML = answerText(r).replace(/(\d[\d.,]*\s?(kg\/h|kg|t))/g, "<b>$1</b>");
    t("today").textContent = kgT(c.producedToday);
    t("todaySub").textContent = `de la ${String(c.shiftStart).padStart(2, "0")}:00 · ritm mediu ${nf(c.producedToday / Math.max(0.1, (new Date().getHours() + new Date().getMinutes() / 60 - c.shiftStart)))} kg/h`;
    t("rate").textContent = nf(c.rate) + " kg/h";
    t("rateSub").textContent = `${nf(c.rate / (c.nominal * c.quality) * 100, 1)}% din maxim · conform ${nf(c.quality * 100, 1)}%`;
    t("p8").textContent = kgT(r.p8);
    t("p8Sub").textContent = `maxim ${kgT(r.n8)}`;
    t("pw").textContent = kgT(r.pWeek);
    t("pwSub").textContent = `${cfg.ture} ture × ${cfg.zile} zile · maxim ${kgT(r.nWeek)}`;
    els.steps.innerHTML = c.steps.map(s => {
      const b = s === c.bottleneck;
      return `<div class="p-step${b ? " bott" : ""}">
        <div class="p-n"><b>${NICE[s.name] || s.name}${b ? '<span class="p-tag">GÂTUIRE</span>' : ""}</b><small>${s.ids.map(id => `${id} ${UI.statusLabel[E.byId[id].status] === "În funcțiune" ? "●" : "○"}`).join("  ")}</small></div>
        <div class="p-bar"><i style="width:${Math.min(100, s.actual / s.nominal * 100).toFixed(1)}%"></i></div>
        <div class="p-v">${nf(s.actual)} kg/h<small>din ${nf(s.nominal)}</small></div></div>`;
    }).join("");
    const rows = [["Tură 8 ore", r.p8, r.n8], [`Zi (${cfg.ture} ture)`, r.pDay, r.nDay], [`Săptămână (${cfg.zile} zile)`, r.pWeek, r.nWeek]];
    els.tb.innerHTML = rows.map(([n, a, m]) => `<tr><td>${n}</td><td>${kgT(a)}</td><td>${kgT(m)}</td><td class="p-loss">−${kgT(Math.max(0, m - a))}</td></tr>`).join("");
  }

  UI.views.capacitate = { init, render };
})();
