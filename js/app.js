// ELIT SCADA - shell: taburi, bara KPI, ceas, toast, helperi comuni
(function () {
  const E = window.ELIT;
  const $ = (s, r = document) => r.querySelector(s);

  // helperi comuni pentru vederi
  window.UI = {
    $, $$: (s, r = document) => [...r.querySelectorAll(s)],
    el(tag, attrs = {}, html = "") { const n = document.createElement(tag); for (const k in attrs) n.setAttribute(k, attrs[k]); n.innerHTML = html; return n; },
    toast(msg, kind = "ok") { const t = $("#toast"); t.textContent = msg; t.className = "toast show " + kind; clearTimeout(t._h); t._h = setTimeout(() => t.className = "toast", 2600); },
    run(id, cmd, val) { const r = E.command(id, cmd, val); UI.toast(r.ok ? "Comandă executată" : r.msg, r.ok ? "ok" : "err"); return r; },
    statusLabel: { run: "În funcțiune", stop: "Oprit", fault: "Defect", maint: "Mentenanță" },
    time(t) { return new Date(t).toLocaleTimeString("ro-RO"); },
    date(t) { return new Date(t).toLocaleDateString("ro-RO"); },
    pct(v) { return (v * 100).toFixed(1) + "%"; },
    // vederile se inregistreaza aici: UI.views.harta = { init(root), render() }
    views: {},
    current: "cereri",
    show(view) {
      UI.current = view;
      UI.$$("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.view === view));
      UI.$$(".view").forEach(s => s.classList.toggle("active", s.id === "view-" + view));
      const v = UI.views[view]; if (v && v.render) v.render();
      if (UI.markDep) UI.markDep(UI.views.cereri && UI.views.cereri.selected ? UI.views.cereri.selected() : "");
    }
  };

  UI.$$("#tabs button").forEach(b => b.onclick = () => UI.show(b.dataset.view));
  // tema luminoasa / intunecata
  try { const t = localStorage.getItem("elit-theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
  $("#themeBtn").onclick = () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("elit-theme", next); } catch (e) {}
  };

  function renderTop() {
    const k = E.kpi();
    $("#topKpis").innerHTML = `
      <div class="kpi"><span>Livrabile TEH</span><b>${E.data.livrabileTEH.length}</b></div>
      <div class="kpi"><span>Departamente</span><b>${E.data.departamente.length}</b></div>
      <div class="kpi"><span>Disponibilitate utilaje</span><b>${UI.pct(k.availability)}</b></div>
      <div class="kpi"><span>OEE producție</span><b>${UI.pct(k.oee)}</b></div>`;
    $("#clock").textContent = new Date().toLocaleString("ro-RO");
  }
  E.on("tick", () => { renderTop(); const v = UI.views[UI.current]; if (v && v.render) v.render(); });
  E.on("change", () => { renderTop(); const v = UI.views[UI.current]; if (v && v.render) v.render(); });

  // reincarcare automata cand ruleaza pe server.py (nu face nimic din file://)
  if (location.protocol.startsWith("http")) {
    let ver = null;
    setInterval(() => {
      fetch("/__version", { cache: "no-store" }).then(r => r.ok ? r.text() : null).then(v => {
        if (!v) return; if (ver && v !== ver) location.reload(); ver = v;
      }).catch(() => {});
    }, 1000);
  }

  // initializarea vederilor dupa ce toate scripturile s-au incarcat
  window.addEventListener("DOMContentLoaded", () => {
    for (const name in UI.views) { const root = document.getElementById("view-" + name); try { UI.views[name].init(root); } catch (e) { console.error(name, e); root.innerHTML = `<p class="err">Eroare vedere ${name}: ${e.message}</p>`; } }
    // bara rapida "Vine cineva de la:" - un click deschide tot ce ii trebuie departamentului
    const qd = $("#quickDeps");
    qd.innerHTML = `<span>Vine cineva de la:</span>` + E.data.departamente.map(d => `<button class="dep-btn" data-dep="${d}">${d}</button>`).join("");
    qd.onclick = ev => {
      const b = ev.target.closest("button[data-dep]"); if (!b) return;
      UI.show("cereri"); if (UI.views.cereri && UI.views.cereri.pick) UI.views.cereri.pick(b.dataset.dep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    UI.markDep = d => UI.$$("#quickDeps button").forEach(b => b.classList.toggle("on", UI.current === "cereri" && b.dataset.dep === d));
    renderTop();
    const h =decodeURIComponent(location.hash.slice(1)).split("/")[0]; UI.show(UI.views[h] ? h : "cereri");
  });
})();
