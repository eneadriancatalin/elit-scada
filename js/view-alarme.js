// ELIT SCADA - vedere "Alarme & jurnal" (UI.views.alarme)
(function () {
  const E = window.ELIT, U = window.UI;

  const CSS = `
  .a-top { display: flex; flex-wrap: wrap; gap: 12px; align-items: stretch; margin-bottom: 14px; }
  .a-cnt { flex: 1 1 150px; min-width: 0; background: var(--panel); border: 1px solid var(--line); border-left: 4px solid var(--line); border-radius: var(--radius); padding: 10px 14px; }
  .a-cnt span { display: block; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
  .a-cnt b { font-family: var(--mono); font-size: 30px; line-height: 1.15; }
  .a-cnt.crit { border-left-color: var(--crit); } .a-cnt.crit.on b { color: var(--crit); }
  .a-cnt.crit.on { border-color: var(--crit); }
  .a-cnt.warn { border-left-color: var(--warn); } .a-cnt.warn.on b { color: var(--warn); }
  .a-cnt.unack { border-left-color: var(--accent); } .a-cnt.unack.on b { color: var(--accent); }
  .a-act { display: flex; flex-direction: column; gap: 8px; justify-content: center; flex: 0 1 200px; min-width: 0; }
  .a-act button { width: 100%; }
  .a-panel { margin-bottom: 14px; }
  .a-ph { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
  .a-ph h3 { margin: 0; }
  .a-flt { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .a-flt select { min-width: 0; max-width: 100%; }
  .a-seg { display: inline-flex; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
  .a-seg button { border: 0; border-radius: 0; background: var(--bg); padding: 6px 12px; color: var(--muted); }
  .a-seg button + button { border-left: 1px solid var(--line); }
  .a-seg button.on { background: var(--text); color: var(--panel); }
  .a-box { max-height: 440px; overflow: auto; border: 1px solid var(--line); border-radius: var(--radius); }
  .a-tbl { font-size: 13px; min-width: 760px; }
  .a-tbl th { position: sticky; top: 0; background: var(--panel2); z-index: 1; padding: 7px 10px; }
  .a-tbl td { padding: 7px 10px; vertical-align: middle; }
  .a-tbl tr.a-new td { background: var(--crit-bg); }
  .a-tbl tr.a-new.a-w td { background: var(--warn-bg); }
  .a-tbl tr.a-gone td { color: var(--muted); }
  .a-tbl .a-t { white-space: nowrap; font-family: var(--mono); font-size: 12px; }
  .a-tbl .a-t small { display: block; color: var(--muted); font-size: 10px; }
  .a-msg { min-width: 220px; }
  .a-lv { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: .04em; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
  .a-lv.crit { background: var(--crit-bg); color: var(--crit); border: 1px solid transparent; }
  .a-lv.warn { background: var(--warn-bg); color: var(--warn); border: 1px solid transparent; }
  .a-tp { display: inline-block; font-size: 11px; padding: 1px 7px; border-radius: 4px; border: 1px solid var(--line); color: var(--muted); white-space: nowrap; }
  .a-tp.cmd { color: var(--accent); border-color: var(--line); }
  .a-tp.alarm { color: var(--warn); border-color: var(--line); }
  .a-tp.system { color: var(--maint); border-color: var(--line); }
  .a-on { color: var(--crit); font-weight: 600; white-space: nowrap; }
  .a-on::before { content: ""; display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--crit); margin-right: 6px; animation: blink .9s infinite; }
  .a-off { color: var(--ok); white-space: nowrap; }
  .a-off small, .a-ackd small { display: block; color: var(--muted); font-family: var(--mono); font-size: 10px; }
  .a-ackd { white-space: nowrap; }
  .a-no { color: var(--muted); }
  .a-eq { background: none; border: 0; padding: 0; color: var(--accent); cursor: pointer; text-align: left; font: inherit; }
  .a-eq:hover { text-decoration: underline; }
  .a-eq b { font-family: var(--mono); font-weight: 600; margin-right: 4px; }
  .a-eq span { color: var(--muted); font-size: 12px; }
  .a-ackbtn { padding: 4px 10px; font-size: 12px; white-space: nowrap; }
  .a-empty { text-align: center; color: var(--muted); padding: 22px !important; }
  .a-foot { color: var(--muted); font-size: 12px; margin-top: 8px; }
  @media (max-width: 700px) {
    .a-act { flex: 1 1 100%; flex-direction: row; }
    .a-cnt { flex: 1 1 28%; padding: 8px 10px; }
    .a-cnt b { font-size: 24px; }
    .a-box { max-height: 380px; }
  }`;

  let root, cCrit, cWarn, cUnack, aBody, eBody, aFoot, eFoot;
  const flt = { scope: "active", level: "", type: "" };
  let aSig = "", eSig = "";

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = () => new Date().toDateString();
  const tcell = t => `<td class="a-t">${U.time(t)}${new Date(t).toDateString() !== today() ? `<small>${U.date(t)}</small>` : ""}</td>`;
  const eqBtn = id => {
    const e = id && E.byId[id];
    return e ? `<button class="a-eq" data-eq="${e.id}" title="Deschide în Utilaje & control"><b>${e.id}</b><span>${esc(e.name)}</span></button>` : `<span class="a-no">Sistem</span>`;
  };
  const LV = { crit: "CRITIC", warn: "AVERTIZARE" };
  const TP = { cmd: "Comandă", alarm: "Alarmă", system: "Sistem" };

  function init(r) {
    root = r;
    const st = document.createElement("style"); st.id = "a-style"; st.textContent = CSS; document.head.appendChild(st);

    root.innerHTML = `
      <div class="a-top">
        <div class="a-cnt crit"><span>Alarme critice active</span><b class="a-c1">0</b></div>
        <div class="a-cnt warn"><span>Avertizări active</span><b class="a-c2">0</b></div>
        <div class="a-cnt unack"><span>Neconfirmate</span><b class="a-c3">0</b></div>
        <div class="a-act">
          <button class="primary a-ackall">✓ Confirmă toate</button>
          <button class="a-csv">⭳ Exportă CSV</button>
        </div>
      </div>

      <section class="panel a-panel">
        <div class="a-ph">
          <h3>Alarme</h3>
          <div class="a-flt">
            <div class="a-seg" role="group" aria-label="Domeniu alarme">
              <button data-scope="active" class="on">Doar active</button><button data-scope="unack">Neconfirmate</button><button data-scope="all">Toate</button>
            </div>
            <select class="a-flv" aria-label="Filtru nivel"><option value="">Toate nivelurile</option><option value="crit">Critice</option><option value="warn">Avertizări</option></select>
          </div>
        </div>
        <div class="a-box">
          <table class="a-tbl">
            <thead><tr><th>Ora</th><th>Nivel</th><th>Utilaj</th><th>Mesaj</th><th>Stare</th><th>Confirmată</th><th></th></tr></thead>
            <tbody class="a-ab"></tbody>
          </table>
        </div>
        <div class="a-foot a-af"></div>
      </section>

      <section class="panel a-panel">
        <div class="a-ph">
          <h3>Jurnal evenimente</h3>
          <div class="a-flt">
            <select class="a-ftp" aria-label="Filtru tip eveniment"><option value="">Toate tipurile</option><option value="cmd">Comenzi</option><option value="alarm">Alarme</option><option value="system">Sistem</option></select>
          </div>
        </div>
        <div class="a-box">
          <table class="a-tbl">
            <thead><tr><th>Ora</th><th>Tip</th><th>Utilizator</th><th>Utilaj</th><th>Mesaj</th></tr></thead>
            <tbody class="a-eb"></tbody>
          </table>
        </div>
        <div class="a-foot a-ef"></div>
      </section>`;

    const q = s => root.querySelector(s);
    cCrit = q(".a-c1"); cWarn = q(".a-c2"); cUnack = q(".a-c3");
    aBody = q(".a-ab"); eBody = q(".a-eb"); aFoot = q(".a-af"); eFoot = q(".a-ef");

    root.querySelectorAll(".a-seg button").forEach(b => b.addEventListener("click", () => {
      flt.scope = b.dataset.scope;
      root.querySelectorAll(".a-seg button").forEach(x => x.classList.toggle("on", x === b));
      render();
    }));
    q(".a-flv").addEventListener("change", ev => { flt.level = ev.target.value; render(); });
    q(".a-ftp").addEventListener("change", ev => { flt.type = ev.target.value; render(); });

    q(".a-ackall").addEventListener("click", () => {
      const n = E.alarms.filter(a => !a.ack).length;
      if (!n) { U.toast("Nu există alarme neconfirmate"); return; }
      E.ackAll(); U.toast(`${n} alarm${n === 1 ? "ă confirmată" : "e confirmate"} de ${E.user}`); render();
    });
    q(".a-csv").addEventListener("click", exportCsv);

    root.addEventListener("click", ev => {
      const eq = ev.target.closest("[data-eq]");
      if (eq) { E.select(eq.dataset.eq); U.show("control"); return; }
      const ack = ev.target.closest("[data-ack]");
      if (ack) { E.ackAlarm(+ack.dataset.ack); render(); }
    });

    render();
  }

  function counters() {
    let crit = 0, warn = 0, unack = 0;
    for (const a of E.alarms) {
      if (a.active) { if (a.level === "crit") crit++; else warn++; }
      if (!a.ack) unack++;
    }
    cCrit.textContent = crit; cWarn.textContent = warn; cUnack.textContent = unack;
    cCrit.parentNode.classList.toggle("on", crit > 0);
    cWarn.parentNode.classList.toggle("on", warn > 0);
    cUnack.parentNode.classList.toggle("on", unack > 0);
  }

  function renderAlarms() {
    const list = E.alarms.filter(a =>
      (flt.scope === "all" || (flt.scope === "active" ? a.active : !a.ack)) &&
      (!flt.level || a.level === flt.level));
    const sig = flt.scope + flt.level + "|" + E.alarms.length + "|" + list.map(a => a.id + (a.active ? "a" : "c") + (a.ack ? "k" : "n")).join(",");
    if (sig === aSig) return;
    aSig = sig;
    aBody.innerHTML = list.length ? list.map(a => `
      <tr class="${!a.ack && a.active ? "a-new" + (a.level === "warn" ? " a-w" : "") : ""}${!a.active ? " a-gone" : ""}">
        ${tcell(a.time)}
        <td><span class="a-lv ${a.level}">${LV[a.level] || a.level}</span></td>
        <td>${eqBtn(a.eqId)}</td>
        <td class="a-msg">${esc(a.msg)}</td>
        <td>${a.active ? `<span class="a-on">Activă</span>` : `<span class="a-off">Revenită${a.cleared ? `<small>${U.time(a.cleared)}</small>` : ""}</span>`}</td>
        <td>${a.ack ? `<span class="a-ackd">${esc(a.ackBy)}<small>${U.time(a.ackTime)}</small></span>` : `<span class="a-no">—</span>`}</td>
        <td>${a.ack ? `<span class="lv-ok" title="Confirmată">✓</span>` : `<button class="okbtn a-ackbtn" data-ack="${a.id}">Confirmă</button>`}</td>
      </tr>`).join("")
      : `<tr><td colspan="7" class="a-empty">${flt.scope === "active" ? "Nicio alarmă activă — instalația funcționează în parametri." : "Nicio alarmă pentru filtrele selectate."}</td></tr>`;
    aFoot.textContent = `${list.length} afișate · ${E.alarms.length} alarme în istoric (max. 300)`;
  }

  function renderEvents() {
    const ev = E.events;
    const sig = flt.type + "|" + ev.length + "|" + (ev[0] ? ev[0].time + ev[0].msg : "");
    if (sig === eSig) return;
    eSig = sig;
    const list = flt.type ? ev.filter(e => e.type === flt.type) : ev;
    eBody.innerHTML = list.length ? list.map(e => `
      <tr>
        ${tcell(e.time)}
        <td><span class="a-tp ${e.type}">${TP[e.type] || e.type}</span></td>
        <td>${esc(e.user)}</td>
        <td>${eqBtn(e.eqId)}</td>
        <td class="a-msg">${esc(e.msg)}</td>
      </tr>`).join("")
      : `<tr><td colspan="5" class="a-empty">Niciun eveniment pentru filtrul selectat.</td></tr>`;
    eFoot.textContent = `${list.length} evenimente afișate · ${ev.length} în jurnal (max. 500)`;
  }

  function exportCsv() {
    const q = v => { const s = String(v == null ? "" : v); return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const dt = t => t ? new Date(t).toLocaleString("ro-RO") : "";
    const eqn = id => id && E.byId[id] ? `${id} - ${E.byId[id].name}` : "Sistem";
    const lines = [];
    lines.push(["Sursa", "Data/ora", "Nivel/Tip", "Utilaj", "Utilizator", "Mesaj", "Stare", "Revenire la", "Confirmata de", "Confirmata la"].map(q).join(";"));
    for (const a of E.alarms) lines.push(["Alarma #" + a.id, dt(a.time), LV[a.level] || a.level, eqn(a.eqId), "", a.msg,
      a.active ? "Activa" : "Revenita", dt(a.cleared), a.ack ? a.ackBy : "", a.ack ? dt(a.ackTime) : ""].map(q).join(";"));
    for (const e of E.events) lines.push(["Jurnal", dt(e.time), TP[e.type] || e.type, eqn(e.eqId), e.user, e.msg, "", "", "", ""].map(q).join(";"));
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const d = new Date(), p2 = n => String(n).padStart(2, "0");
    const name = `ELIT_SCADA_alarme_jurnal_${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    E.log(null, `Export CSV alarme & jurnal (${E.alarms.length} alarme, ${E.events.length} evenimente)`, "system");
    U.toast(`Export CSV: ${name}`);
  }

  function render() {
    if (!root) return;
    counters();
    renderAlarms();
    renderEvents();
  }

  U.views.alarme = { init, render };
})();
