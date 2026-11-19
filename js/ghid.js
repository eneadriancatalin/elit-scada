// ELIT SCADA - ghid "Cum folosesti aplicatia" pentru colegi fara experienta cu platforme SCADA.
// Buton "Ajutor" in antet; se deschide singur la prima vizita (retinut in localStorage).
(function () {
  const KEY = "elit-ghid-vazut-2";
  const CSS = `
  .g-ov { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 200; display: grid; place-items: center; padding: 16px; }
  .g-box { background: var(--panel); color: var(--text); border-radius: 10px; box-shadow: 0 0 0 1px var(--line), 0 20px 60px rgba(0,0,0,.25); width: min(860px, 100%); max-height: calc(100vh - 32px); overflow: auto; padding: 24px; }
  .g-box h2 { margin: 0 0 4px; font-size: 22px; font-weight: 600; }
  .g-box > p { margin: 0 0 18px; color: var(--muted); }
  .g-big { border: 1px solid var(--line); border-left: 4px solid var(--accent); border-radius: 6px; padding: 14px 16px; margin-bottom: 18px; }
  .g-big b { display: block; font-size: 15px; margin-bottom: 4px; }
  .g-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  @media (max-width: 640px) { .g-grid { grid-template-columns: minmax(0, 1fr); } .g-box { padding: 18px; } }
  .g-it { border: 1px solid var(--line); border-radius: 6px; padding: 12px; font-size: 13px; }
  .g-it b { display: block; font-size: 14px; margin-bottom: 4px; }
  .g-it span { color: var(--muted); }
  .g-sec { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; margin: 18px 0 8px; }
  .g-leg { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; }
  .g-leg i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
  .g-act { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; flex-wrap: wrap; }
  `;
  const ITEMS = [
    ["Departamente", "Pagina principală. Alegi departamentul și vezi toate datele pe care i le oferim (livrabilele TEH), cu un exemplu pentru fiecare și buton „Copiază”. Jos: ce primim noi de la el."],
    ["Flux informațional", "Harta legăturilor: ce primim de la fiecare departament (stânga, coduri -T) și ce le dăm noi (dreapta, coduri TEH), după documentele de mapare."],
    ["Harta halei", "Planul fabricii, cu utilajele. „Arată pentru” evidențiază utilajele care contează pentru un departament. Click pe utilaj = detalii și cine îi folosește datele."],
    ["Producție & capacitate", "„Cât producem pe tură / zi / săptămână?” – răspunsul e scris gata în partea de sus, pentru Vânzări, Producție, Director General."],
    ["Mentenanță & KPI", "Planul de mentenanță (TEH 003) și indicatorii OEE, MTBF, MTTR. De aici generezi rapoartele TEH 001 și TEH 019."]
  ];

  function open() {
    close();
    const ov = document.createElement("div"); ov.className = "g-ov"; ov.id = "g-ov";
    ov.innerHTML = `<div class="g-box" role="dialog" aria-modal="true" aria-label="Cum folosești aplicația">
      <h2>Cum folosești aplicația</h2>
      <p>Aplicația arată ce date oferă Departamentul Tehnic celorlalte departamente și ce primește de la ele, după documentele de mapare ELIT Tehnic. Valorile sunt exemplificative. Nu poți strica nimic: tot ce notezi rămâne doar în browserul tău.</p>
      <div class="g-big"><b>Vine cineva de la alt departament și îți cere o informație?</b>
        Apasă pe departamentul lui în bara <b style="display:inline">„Vine cineva de la:”</b> de sub meniu. Vezi pe un ecran toate livrabilele pe care i le dăm, cu exemplu și buton „Copiază”. Dacă nu știi de unde e cererea, folosește căutarea (ex. „temperatură”, „piese”, „energie”).</div>
      <div class="g-sec">Ecranele</div>
      <div class="g-grid">${ITEMS.map(([t, d]) => `<div class="g-it"><b>${t}</b><span>${d}</span></div>`).join("")}</div>
      <div class="g-sec">Culorile de stare (la utilaje)</div>
      <div class="g-leg">
        <span><i style="background:var(--ok)"></i>În funcțiune / în regulă</span>
        <span><i style="background:var(--maint)"></i>În mentenanță</span>
        <span><i style="background:var(--stop)"></i>Oprit</span>
      </div>
      <p style="color:var(--muted);font-size:13px;margin:10px 0 0">Culorile departamentelor (bara „Vine cineva de la:”) arată doar cine e departamentul, nu o stare.</p>
      <div class="g-act">
        <button class="primary" data-g="ok">Am înțeles, încep</button>
      </div>
    </div>`;
    ov.addEventListener("click", e => {
      if (e.target === ov) return close();
      const b = e.target.closest("[data-g]"); if (!b) return;
      close(); if (b.dataset.g === "demo" && window.DEMO) window.DEMO.start();
    });
    document.body.appendChild(ov);
    ov.querySelector('[data-g="ok"]').focus();
  }
  function close() {
    const o = document.getElementById("g-ov"); if (o) o.remove();
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
  }
  document.addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("g-ov")) close(); });

  window.addEventListener("DOMContentLoaded", () => {
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    const btn = document.createElement("button"); btn.textContent = "Ajutor"; btn.title = "Cum folosești aplicația";
    btn.onclick = open;
    const theme = document.getElementById("themeBtn"); theme.parentNode.insertBefore(btn, theme);
    let seen = false; try { seen = localStorage.getItem(KEY) === "1"; } catch (e) {}
    if (!seen) setTimeout(open, 400);
  });
  window.GHID = { open, close };
})();
