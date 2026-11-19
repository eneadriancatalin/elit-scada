// ELIT SCADA - vedere "Utilaje & control" (UI.views.control)
(function () {
  const E = window.ELIT, U = window.UI;
  const PROGRAMS = ["Fierbere", "Afumare", "Uscare", "Duș răcire"];
  const NS = "http://www.w3.org/2000/svg";
  const SW = 240, SH = 64; // dimensiuni viewBox sparkline

  const CSS = `
  .c-wrap { display: grid; grid-template-columns: minmax(0, 440px) minmax(0, 1fr); gap: 14px; align-items: start; }
  .c-toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
  .c-toolbar input[type=search] { flex: 1 1 160px; min-width: 0; }
  .c-toolbar select { flex: 0 1 auto; min-width: 0; max-width: 100%; }
  .c-op { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px 10px; background: var(--panel2); border: 1px solid var(--line); border-radius: var(--radius); }
  .c-op label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
  .c-op input { flex: 1; min-width: 0; }
  .c-listbox { max-height: calc(100vh - 290px); min-height: 260px; overflow: auto; border: 1px solid var(--line); border-radius: var(--radius); }
  .c-list { font-size: 13px; }
  .c-list th { position: sticky; top: 0; background: var(--panel2); z-index: 1; padding: 7px 8px; }
  .c-list td { padding: 7px 8px; vertical-align: middle; }
  .c-list tbody tr { cursor: pointer; transition: background .12s; }
  .c-list tbody tr:hover { background: var(--panel2); }
  .c-list tbody tr.sel { background: var(--panel2); box-shadow: inset 2px 0 0 var(--text); }
  .c-list .c-nm { max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .c-list .c-v { text-align: right; white-space: nowrap; }
  .c-list .c-v small { color: var(--muted); margin-left: 3px; }
  .c-count { color: var(--muted); font-size: 12px; margin-top: 8px; }
  .c-empty { padding: 18px; text-align: center; color: var(--muted); }

  .c-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; border-bottom: 1px solid var(--line); padding-bottom: 12px; margin-bottom: 12px; }
  .c-title { font-size: 19px; font-weight: 700; }
  .c-title .mono { color: var(--accent); margin-right: 8px; }
  .c-sub { color: var(--muted); font-size: 12px; margin-top: 2px; }
  .c-head .pill { font-size: 13px; padding: 4px 12px; }
  .c-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 12px; }
  .c-meta div { background: var(--panel2); border: 1px solid var(--line); border-radius: var(--radius); padding: 6px 10px; }
  .c-meta span { display: block; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
  .c-meta b { font-family: var(--mono); font-size: 16px; }
  .c-meta b.soon { color: var(--warn); }
  .c-note { display: none; margin-bottom: 12px; padding: 8px 12px; border-radius: var(--radius); border: 1px solid; font-size: 13px; }
  .c-note.show { display: block; }
  .c-note.fault { border-color: var(--crit); background: var(--crit-bg); color: var(--crit); }
  .c-note.maint { border-color: var(--maint); background: var(--maint-bg); color: var(--maint); }
  .c-sec { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; margin: 4px 0 8px; }
  .c-ctrls { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  .c-ctrls button { min-width: 0; }
  .c-ctrls .c-demo { margin-left: auto; border-style: dashed; color: var(--muted); }
  .c-extra { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
  .c-box { flex: 1 1 220px; min-width: 0; background: var(--panel2); border: 1px solid var(--line); border-radius: var(--radius); padding: 8px 12px; }
  .c-box label { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); margin-bottom: 4px; }
  .c-box label b { color: var(--text); font-family: var(--mono); }
  .c-box input[type=range] { width: 100%; accent-color: var(--accent); padding: 0; border: 0; background: none; }
  .c-box select { width: 100%; }
  .c-box .c-ticks { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); font-family: var(--mono); }

  .c-params { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
  .c-card { background: var(--panel); border: 1px solid var(--line); border-left: 2px solid var(--ok); border-radius: var(--radius); padding: 10px 12px; min-width: 0; }
  .c-card.warn { border-left-color: var(--warn); }
  .c-card.crit { border-left-color: var(--crit); background: var(--crit-bg); }
  .c-card-h { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--muted); }
  .c-card-h b { color: var(--text); font-weight: 600; }
  .c-val { margin: 4px 0 2px; display: flex; align-items: baseline; gap: 6px; }
  .c-val b { font-family: var(--mono); font-size: 32px; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
  .c-val small { color: var(--muted); font-size: 14px; }
  .c-val .c-arrow { margin-left: auto; font-size: 13px; color: var(--muted); font-family: var(--mono); }
  .c-spark { display: block; width: 100%; height: 64px; background: var(--bg); border: 1px solid var(--line); border-radius: 6px; }
  .c-spark .band { fill: var(--ok); fill-opacity: .08; }
  .c-spark .out { fill: var(--crit); fill-opacity: .06; }
  .c-spark .lim { stroke: var(--muted); stroke-width: 1; stroke-dasharray: 3 3; opacity: .6; vector-effect: non-scaling-stroke; }
  .c-spark .spl { stroke: var(--accent); stroke-width: 1; stroke-dasharray: 6 3; opacity: .55; vector-effect: non-scaling-stroke; }
  .c-spark .ln { fill: none; stroke: var(--ok); stroke-width: 1.8; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
  .c-card.warn .c-spark .ln { stroke: var(--warn); }
  .c-card.crit .c-spark .ln { stroke: var(--crit); }
  .c-axis { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); font-family: var(--mono); margin-top: 2px; }
  .c-sp { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 12px; color: var(--muted); flex-wrap: wrap; }
  .c-sp .c-spv { color: var(--accent); font-family: var(--mono); font-size: 13px; margin-right: auto; }
  .c-sp input { width: 90px; min-width: 0; }
  .c-sp button { padding: 5px 10px; }
  .c-nocmd { color: var(--muted); font-size: 13px; padding: 6px 0; }

  @media (max-width: 960px) {
    .c-wrap { grid-template-columns: minmax(0, 1fr); }
    .c-listbox { max-height: 330px; }
  }
  @media (max-width: 520px) {
    .c-params { grid-template-columns: minmax(0, 1fr); }
    .c-val b { font-size: 28px; }
    .c-ctrls button { flex: 1 1 45%; }
    .c-ctrls .c-demo { margin-left: 0; }
    .c-title { font-size: 17px; }
  }`;

  let root, tbody, countEl, detail, opInput, fSearch, fZone, fStatus;
  let cur = null;          // id utilaj afisat in detaliu
  let rows = {};           // id -> {tr, dot, val, st}
  let dref = null;         // referinte elemente detaliu

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const zoneName = id => (E.data.zones.find(z => z.id === id) || {}).name || id;
  const unitTxt = u => u ? " " + u : "";
  const svgEl = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  const lvClass = st => "lv-" + st;

  function init(r) {
    root = r;
    const st = document.createElement("style"); st.id = "c-style"; st.textContent = CSS; document.head.appendChild(st);

    root.innerHTML = `
      <div class="c-wrap">
        <section class="panel c-left">
          <h3>Utilaje</h3>
          <div class="c-op"><label for="c-op">Operator</label><input id="c-op" type="text" maxlength="40" autocomplete="off" placeholder="Nume operator"></div>
          <div class="c-toolbar">
            <input type="search" class="c-q" placeholder="Caută cod sau denumire…" aria-label="Caută utilaj">
            <select class="c-fz" aria-label="Filtru zonă"><option value="">Toate zonele</option>${E.data.zones.map(z => `<option value="${z.id}">${z.id} · ${esc(z.name)}</option>`).join("")}</select>
            <select class="c-fs" aria-label="Filtru stare"><option value="">Toate stările</option>${Object.keys(U.statusLabel).map(k => `<option value="${k}">${U.statusLabel[k]}</option>`).join("")}<option value="alarm">Cu alarmă activă</option></select>
          </div>
          <div class="c-listbox">
            <table class="c-list">
              <thead><tr><th></th><th>Cod</th><th>Denumire</th><th>Zonă</th><th style="text-align:right">Valoare</th><th>Stare</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="c-count"></div>
        </section>
        <section class="panel c-detail"></section>
      </div>`;

    tbody = root.querySelector(".c-list tbody");
    countEl = root.querySelector(".c-count");
    detail = root.querySelector(".c-detail");
    opInput = root.querySelector("#c-op");
    fSearch = root.querySelector(".c-q"); fZone = root.querySelector(".c-fz"); fStatus = root.querySelector(".c-fs");

    opInput.value = E.user;
    opInput.addEventListener("input", () => { E.user = opInput.value.trim() || "Operator TEH"; });
    opInput.addEventListener("blur", () => { if (!opInput.value.trim()) opInput.value = E.user; });
    [fSearch, fZone, fStatus].forEach(n => n.addEventListener(n.tagName === "SELECT" ? "change" : "input", applyFilter));

    buildList();
    tbody.addEventListener("click", ev => { const tr = ev.target.closest("tr[data-id]"); if (tr) E.select(tr.dataset.id); });

    E.on("select", id => { if (E.byId[id]) { cur = id; buildDetail(); markSelected(); } });

    cur = (E.selected && E.byId[E.selected]) ? E.selected : E.equipment[0].id;
    buildDetail(); markSelected(); render();
  }

  // ---------- lista
  function buildList() {
    tbody.innerHTML = E.equipment.map(e => `
      <tr data-id="${e.id}">
        <td><span class="dot"></span></td>
        <td class="mono">${e.id}</td>
        <td class="c-nm" title="${esc(e.name)}">${esc(e.name)}</td>
        <td title="${esc(zoneName(e.zone))}">${e.zone}</td>
        <td class="c-v mono"></td>
        <td><span class="pill"></span></td>
      </tr>`).join("") + `<tr class="c-none" style="display:none"><td colspan="6" class="c-empty">Niciun utilaj nu corespunde filtrelor.</td></tr>`;
    rows = {};
    tbody.querySelectorAll("tr[data-id]").forEach(tr => {
      rows[tr.dataset.id] = { tr, dot: tr.querySelector(".dot"), val: tr.querySelector(".c-v"), st: tr.querySelector(".pill") };
    });
  }

  function updateList() {
    for (const e of E.equipment) {
      const r = rows[e.id]; if (!r) continue;
      const dotCls = "dot " + e.status;
      if (r.dot.className !== dotCls) r.dot.className = dotCls;
      const p = e.params[0];
      if (p) {
        const html = `<span class="${lvClass(E.paramState(e, p))}">${E.fmt(e.values[p.key])}</span><small>${esc(p.unit)}</small>`;
        if (r.val._h !== html) { r.val.innerHTML = html; r.val._h = html; }
      } else if (r.val._h !== "—") { r.val.textContent = "—"; r.val._h = "—"; }
      const alarm = E.eqState(e);
      const pillCls = "pill st-" + e.status;
      if (r.st.className !== pillCls) r.st.className = pillCls;
      const txt = U.statusLabel[e.status] + (alarm !== "ok" && e.status !== "fault" ? (alarm === "crit" ? " ⚠" : " !") : "");
      if (r.st.textContent !== txt) r.st.textContent = txt;
    }
    applyFilter();
  }

  function applyFilter() {
    const q = fSearch.value.trim().toLowerCase(), z = fZone.value, s = fStatus.value;
    let n = 0;
    for (const e of E.equipment) {
      const ok = (!q || (e.id + " " + e.name).toLowerCase().includes(q)) &&
        (!z || e.zone === z) &&
        (!s || (s === "alarm" ? E.eqState(e) !== "ok" : e.status === s));
      const r = rows[e.id]; const d = ok ? "" : "none";
      if (r.tr.style.display !== d) r.tr.style.display = d;
      if (ok) n++;
    }
    const none = tbody.querySelector(".c-none"); none.style.display = n ? "none" : "";
    countEl.textContent = `${n} din ${E.equipment.length} utilaje afișate`;
  }

  function markSelected() { for (const id in rows) rows[id].tr.classList.toggle("sel", id === cur); }

  // ---------- detaliu
  function buildDetail() {
    const e = E.byId[cur]; if (!e) { detail.innerHTML = `<p class="c-empty">Selectați un utilaj.</p>`; dref = null; return; }
    const has = c => e.controls.includes(c);
    const ctrls = [];
    if (has("startstop")) {
      ctrls.push(`<button class="okbtn" data-cmd="start">▶ Start</button>`);
      ctrls.push(`<button class="danger" data-cmd="stop">■ Stop</button>`);
    }
    ctrls.push(`<button class="primary" data-cmd="reset">↺ Reset defect</button>`);
    ctrls.push(`<button data-cmd="maint">🔧 Trecere în mentenanță</button>`);
    ctrls.push(`<button class="okbtn" data-cmd="maintDone">✓ Finalizare mentenanță</button>`);
    if (has("test")) ctrls.push(`<button class="primary" data-cmd="test">Test detector</button>`);
    if (has("startstop")) ctrls.push(`<button class="c-demo" data-cmd="fault" title="Generează un defect pentru demonstrație">Simulează defect</button>`);

    const extra = [];
    if (has("speed")) extra.push(`
      <div class="c-box"><label>Viteză / turație <b class="c-spdv">${e.speed}%</b></label>
        <input type="range" class="c-spd" min="0" max="120" step="5" value="${e.speed}" aria-label="Viteză">
        <div class="c-ticks"><span>0%</span><span>60%</span><span>100%</span><span>120%</span></div></div>`);
    if (has("program")) extra.push(`
      <div class="c-box"><label>Program tratament termic <b class="c-prgv">${esc(e.program || "—")}</b></label>
        <select class="c-prg" aria-label="Program">${PROGRAMS.map(p => `<option${p === e.program ? " selected" : ""}>${p}</option>`).join("")}</select></div>`);

    detail.innerHTML = `
      <div class="c-head">
        <div><div class="c-title"><span class="mono">${e.id}</span>${esc(e.name)}</div>
          <div class="c-sub">${e.zone} · ${esc(zoneName(e.zone))} · tip: ${esc(e.type)}</div></div>
        <span class="pill c-st"></span>
      </div>
      <div class="c-meta">
        <div><span>Ore funcționare</span><b class="c-rh"></b></div>
        <div><span>MTBF</span><b>${e.mtbf} h</b></div>
        <div><span>MTTR</span><b>${e.mttr} h</b></div>
        <div><span>Opriri neplanif.</span><b class="c-stops"></b></div>
        <div><span>Următoarea mentenanță</span><b class="c-nm2"></b></div>
      </div>
      <div class="c-note"></div>
      <div class="c-sec">Comenzi</div>
      <div class="c-ctrls">${ctrls.join("")}</div>
      ${extra.length ? `<div class="c-extra">${extra.join("")}</div>` : ""}
      <div class="c-sec">Parametri de proces</div>
      ${e.params.length ? `<div class="c-params">${e.params.map(p => cardHtml(e, p)).join("")}</div>` : `<div class="c-nocmd">Fără parametri măsurați.</div>`}
    `;

    dref = {
      id: e.id, st: detail.querySelector(".c-st"), rh: detail.querySelector(".c-rh"), stops: detail.querySelector(".c-stops"),
      nm: detail.querySelector(".c-nm2"), note: detail.querySelector(".c-note"),
      btn: Object.fromEntries([...detail.querySelectorAll("[data-cmd]")].map(b => [b.dataset.cmd, b])),
      spd: detail.querySelector(".c-spd"), spdv: detail.querySelector(".c-spdv"),
      prg: detail.querySelector(".c-prg"), prgv: detail.querySelector(".c-prgv"),
      cards: {}
    };

    // comenzi
    detail.querySelector(".c-ctrls").addEventListener("click", ev => {
      const b = ev.target.closest("[data-cmd]"); if (!b || b.disabled) return;
      const cmd = b.dataset.cmd;
      if (cmd === "maint") {
        const reason = window.prompt("Motivul trecerii în mentenanță (ex.: revizie preventivă, înlocuire rulmenți):", "Mentenanță preventivă");
        if (reason === null) return;
        U.run(e.id, "maint", reason.trim());
      } else if (cmd === "fault") {
        E.simulateFault(e.id, "Defect simulat (demo)"); U.toast("Defect simulat pe " + e.id, "err");
      } else if (cmd === "stop" && e.status === "run" && /^(AF|FRG|CAZ|DEP|CF|MAT)/.test(e.id) && !window.confirm(`Confirmați oprirea utilajului ${e.name}?`)) {
        return;
      } else U.run(e.id, cmd);
      render();
    });

    if (dref.spd) {
      dref.spd.addEventListener("input", () => { dref.spdv.textContent = dref.spd.value + "%"; });
      dref.spd.addEventListener("change", () => { U.run(e.id, "speed", +dref.spd.value); render(); });
    }
    if (dref.prg) dref.prg.addEventListener("change", () => { U.run(e.id, "program", dref.prg.value); render(); });

    detail.querySelectorAll(".c-card").forEach(card => {
      const k = card.dataset.k;
      const c = {
        card, val: card.querySelector(".c-val b"), arrow: card.querySelector(".c-arrow"),
        svg: card.querySelector("svg"), spv: card.querySelector(".c-spv"),
        amax: card.querySelector(".c-amax"), amin: card.querySelector(".c-amin"),
        inp: card.querySelector(".c-sp input"), apply: card.querySelector(".c-sp button")
      };
      const s = c.svg;
      c.outHi = svgEl("rect", { class: "out", x: 0, width: SW }); c.outLo = svgEl("rect", { class: "out", x: 0, width: SW });
      c.band = svgEl("rect", { class: "band", x: 0, width: SW });
      c.lHi = svgEl("line", { class: "lim", x1: 0, x2: SW }); c.lLo = svgEl("line", { class: "lim", x1: 0, x2: SW });
      c.lSp = svgEl("line", { class: "spl", x1: 0, x2: SW });
      c.path = svgEl("path", { class: "ln" });
      [c.outHi, c.outLo, c.band, c.lHi, c.lLo, c.lSp, c.path].forEach(n => s.appendChild(n));
      if (c.inp) {
        const apply = () => {
          const p = e.params.find(x => x.key === k);
          const raw = c.inp.value.replace(",", ".").trim();
          if (raw === "" || isNaN(+raw)) { U.toast("Introduceți o valoare numerică", "err"); c.inp.focus(); return; }
          const v = +raw;
          if (v < p.min || v > p.max) { U.toast(`Valoare în afara domeniului ${p.min}…${p.max}${unitTxt(p.unit)}`, "err"); c.inp.focus(); return; }
          if (U.run(e.id, "setpoint", { key: k, value: v }).ok) { c.inp.value = ""; }
          render();
        };
        c.apply.addEventListener("click", apply);
        c.inp.addEventListener("keydown", ev => { if (ev.key === "Enter") apply(); });
      }
      dref.cards[k] = c;
    });
  }

  function cardHtml(e, p) {
    const sp = e.controls.includes("setpoint");
    const step = Math.abs(p.max - p.min) <= 2 ? 0.01 : Math.abs(p.max - p.min) <= 30 ? 0.1 : 1;
    return `
      <div class="c-card" data-k="${p.key}">
        <div class="c-card-h"><b>${esc(p.label)}</b><span class="mono" title="Limite alarmă">lo ${p.lo} · hi ${p.hi}${unitTxt(esc(p.unit))}</span></div>
        <div class="c-val"><b>—</b><small>${esc(p.unit)}</small><span class="c-arrow"></span></div>
        <svg class="c-spark" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="none" role="img" aria-label="Tendință ${esc(p.label)}"></svg>
        <div class="c-axis"><span class="c-amin"></span><span>ultimele 120 s</span><span class="c-amax"></span></div>
        <div class="c-sp"><span>SP</span><span class="c-spv"></span>
          ${sp ? `<input type="number" inputmode="decimal" step="${step}" min="${p.min}" max="${p.max}" aria-label="Setpoint nou ${esc(p.label)}"><button class="primary">Aplică</button>` : ""}
        </div>
      </div>`;
  }

  function updateSpark(c, e, p) {
    const h = e.history[p.key] || [];
    let mn = Math.min(p.lo, p.sp), mx = Math.max(p.hi, p.sp);
    for (const v of h) { if (v < mn) mn = v; if (v > mx) mx = v; }
    const pad = (mx - mn) * 0.12 || 1; mn -= pad; mx += pad;
    const y = v => (SH - (v - mn) / (mx - mn) * SH).toFixed(2);
    const yHi = +y(p.hi), yLo = +y(p.lo);
    c.outHi.setAttribute("y", 0); c.outHi.setAttribute("height", Math.max(0, yHi));
    c.outLo.setAttribute("y", yLo); c.outLo.setAttribute("height", Math.max(0, SH - yLo));
    c.band.setAttribute("y", yHi); c.band.setAttribute("height", Math.max(0, yLo - yHi));
    c.lHi.setAttribute("y1", yHi); c.lHi.setAttribute("y2", yHi);
    c.lLo.setAttribute("y1", yLo); c.lLo.setAttribute("y2", yLo);
    const ySp = y(p.sp); c.lSp.setAttribute("y1", ySp); c.lSp.setAttribute("y2", ySp);
    if (h.length > 1) {
      const n = 120, dx = SW / (n - 1), off = n - h.length;
      let d = "";
      for (let i = 0; i < h.length; i++) d += (i ? "L" : "M") + ((off + i) * dx).toFixed(1) + " " + y(h[i]);
      c.path.setAttribute("d", d);
    } else c.path.setAttribute("d", "");
    c.amin.textContent = E.fmt(mn); c.amax.textContent = E.fmt(mx);
  }

  function updateDetail() {
    const e = E.byId[cur]; if (!e || !dref || dref.id !== e.id) return;
    const pillCls = "pill c-st st-" + e.status;
    if (dref.st.className !== pillCls) dref.st.className = pillCls;
    dref.st.textContent = U.statusLabel[e.status];
    dref.rh.textContent = Math.round(e.runHours).toLocaleString("ro-RO") + " h";
    dref.stops.textContent = e.stops + " / lună";
    const days = Math.ceil((e.nextMaint - Date.now()) / 864e5);
    dref.nm.textContent = `${U.date(e.nextMaint)} (${days} z)`;
    dref.nm.classList.toggle("soon", days <= 5);

    let note = "", ncls = "c-note";
    if (e.status === "fault") { note = `⚠ DEFECT: ${esc(e.faultReason || "necunoscut")} — remediați cauza, apoi apăsați „Reset defect”.`; ncls += " show fault"; }
    else if (e.status === "maint") { note = `🔧 Utilaj în mentenanță (LOTO). Pornirea este blocată până la „Finalizare mentenanță”.`; ncls += " show maint"; }
    if (dref.note.className !== ncls) dref.note.className = ncls;
    if (dref.note._h !== note) { dref.note.innerHTML = note; dref.note._h = note; }

    const b = dref.btn, s = e.status;
    const dis = { start: s !== "stop", stop: s !== "run", reset: s !== "fault", maint: s === "maint", maintDone: s !== "maint", test: s !== "run", fault: s !== "run" };
    for (const k in b) if (k in dis && b[k].disabled !== dis[k]) b[k].disabled = dis[k];

    if (dref.spd && document.activeElement !== dref.spd) {
      if (+dref.spd.value !== e.speed) dref.spd.value = e.speed;
      dref.spdv.textContent = e.speed + "%";
    }
    if (dref.prg) {
      if (document.activeElement !== dref.prg && dref.prg.value !== e.program) dref.prg.value = e.program;
      dref.prgv.textContent = e.program || "—";
    }

    for (const p of e.params) {
      const c = dref.cards[p.key]; if (!c) continue;
      const st = E.paramState(e, p);
      const cls = "c-card" + (st !== "ok" ? " " + st : "");
      if (c.card.className !== cls) c.card.className = cls;
      const v = e.values[p.key];
      c.val.textContent = E.fmt(v);
      c.val.className = lvClass(st);
      const h = e.history[p.key];
      const prev = h.length > 5 ? h[h.length - 6] : v;
      const tr = Math.abs(v - prev) < (p.hi - p.lo) * 0.01 ? "→" : v > prev ? "↗" : "↘";
      c.arrow.textContent = tr;
      c.spv.textContent = E.fmt(p.sp) + unitTxt(p.unit);
      if (c.inp && document.activeElement !== c.inp) c.inp.placeholder = E.fmt(p.sp);
      updateSpark(c, e, p);
    }
  }

  function render() {
    if (!root) return;
    if (document.activeElement !== opInput && opInput.value !== E.user) opInput.value = E.user;
    const want = (E.selected && E.byId[E.selected]) ? E.selected : cur;
    if (want !== cur || !dref) { cur = want; buildDetail(); markSelected(); }
    updateList();
    updateDetail();
  }

  U.views.control = { init, render };
})();
