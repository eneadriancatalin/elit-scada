// ELIT SCADA - vedere "Harta halei": plan tip canvas (pan/zoom), utilaje ilustrate, flux pe 7 pasi, panou utilaj
(function () {
  const E = window.ELIT, U = window.UI, D = E.data;
  const zoneById = Object.fromEntries(D.zones.map(z => [z.id, z]));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const trunc = (s, n) => (s.length <= n ? s : s.slice(0, Math.max(1, n - 1)) + "…");

  let root, svg, side;
  let refs = {}, segs = [], legend = {}, panel = null, panelSig = "", attnSig = "";
  let sel = E.selected || null;

  // ---------- CSS
  const CSS = `
.h-bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px;margin-bottom:12px;padding:10px 14px}
.h-title{margin-right:auto;min-width:0}
.h-title b{display:block;font-size:15px}
.h-title span{color:var(--muted);font-size:12px}
.h-legend{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center}
.h-lg{display:inline-flex;align-items:center;font-size:12px;color:var(--muted);white-space:nowrap}
.h-lg b{font-family:var(--mono);color:var(--text);margin-left:5px;font-weight:600}
.h-lg-warn{display:inline-block;width:14px;height:10px;border:2px dashed var(--warn);border-radius:3px;margin-right:6px}
.h-lg-flow{display:inline-block;width:22px;border-top:2px dashed;margin-right:6px}
.h-sep{width:1px;height:18px;background:var(--line)}
.h-layout{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:14px;align-items:start}
.h-layout>*{min-width:0}
.h-bar>*{min-width:0}
.h-hint{color:var(--muted);font-size:12px;margin:6px 2px 0}
.h-side{padding:0;overflow:hidden;position:sticky;top:12px}
@media (max-width:1100px){.h-layout{grid-template-columns:minmax(0,1fr)}.h-side{position:static}}
@media (max-width:800px){.h-sep{display:none}.h-title{flex:1 1 100%}}

/* harta - canvas */
.h-tools{gap:6px 14px !important;padding:6px 10px !important;justify-content:flex-start !important}
.h-ttl{font-size:13px;font-weight:600;white-space:nowrap}
.h-tools .h-dept{flex:0 1 auto;font-size:12px;gap:6px}
.h-tools .h-dept select{height:26px;font-size:12px;padding:0 6px;flex:0 1 170px}
.h-tools .h-legend{gap:4px 10px;flex:1 1 auto}
.h-tools .h-lg{font-size:11px}
.h-tools .h-zoom{margin-left:auto}
.h-tools .h-zoom button{height:26px;min-width:26px;padding:0 7px;font-size:12px}

.h-mapbox{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;min-width:0}
.h-tools{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid var(--line)}
.h-dept{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);min-width:0;flex:1 1 220px}
.h-dept select{min-width:0;flex:0 1 210px;max-width:100%}
.h-dhint{padding:7px 12px;font-size:13px;color:var(--text);background:var(--panel2);border-bottom:1px solid var(--line)}
.h-dhint b{font-weight:600}
.h-dhint span{color:var(--muted)}
.h-eq.dim{opacity:.25}
.h-eq.hl .h-halo{stroke:var(--crit);stroke-width:3.5}
.h-canvas{position:relative;height:clamp(440px,70vh,800px);overflow:hidden;touch-action:none;cursor:grab}
.h-canvas.h-drag{cursor:grabbing}
.h-map{display:block;width:100%;height:100%;user-select:none;-webkit-user-select:none}
.h-zoom{display:flex;gap:4px;align-items:center;flex:none}
.h-zoom button{height:28px;min-width:28px;padding:0 9px;font-size:13px}
.h-zoom span{font:12px var(--mono);color:var(--muted);min-width:44px;text-align:center}
@media (max-width:700px){.h-canvas{height:min(62vh,520px)}.h-zoom button[data-zoom="fit"]{padding:0 8px}}
.h-band{font:600 19px var(--font, inherit);letter-spacing:.08em;fill:var(--muted)}
.h-col{fill:var(--bg);stroke:var(--line-strong, var(--line));stroke-width:1}
.h-brbox{stroke-dasharray:5 4}
.h-wall{stroke:var(--line);stroke-width:1}
.h-stepn{font:600 30px var(--mono);fill:var(--muted)}
.h-stept{font:600 19px var(--font, inherit);fill:var(--text)}
.h-arw line,.h-arw .h-brl{fill:none;stroke:var(--line-strong, var(--line));stroke-width:2}
.h-arw path:not(.h-brl){fill:var(--line-strong, var(--line))}
.h-arw .h-puls{fill:var(--text);opacity:0}
.h-arw.on line{stroke:var(--text)}
.h-arw.on path:not(.h-brl){fill:var(--text)}
.h-arw.on .h-puls{opacity:1;animation:h-move 1.6s linear infinite}
.h-br .h-brl{stroke-dasharray:6 5}
.h-br.on .h-brl{stroke:var(--muted);animation:h-dash 1.2s linear infinite}
.h-br.on path:not(.h-brl){fill:var(--muted)}
.h-eq{cursor:pointer;outline:none}
.h-hit{fill:transparent}
.h-pad{fill:var(--panel)}
.h-eq:hover .h-pad{fill:var(--panel2)}
.h-halo{fill:none;stroke:var(--line-strong, var(--line));stroke-width:1.5}
.s-run .h-halo{stroke:var(--ok)}
.s-maint .h-halo{stroke:var(--maint);stroke-dasharray:5 4}
.s-fault .h-halo{stroke:var(--crit);stroke-width:2;animation:h-blink 1.2s ease-in-out infinite}
.w-warn .h-halo{stroke:var(--warn);stroke-width:2}
.w-crit:not(.s-fault) .h-halo{stroke:var(--crit);stroke-width:2}
.h-dot{fill:var(--stop)}
.s-run .h-dot{fill:var(--ok)}
.s-fault .h-dot{fill:var(--crit)}
.s-maint .h-dot{fill:var(--maint)}
.w-warn .h-dot{stroke:var(--warn);stroke-width:2}
.h-selr{fill:none;stroke:var(--text);stroke-width:2;opacity:0;pointer-events:none}
.sel .h-selr{opacity:1}
.h-eq:focus-visible .h-selr{opacity:.5}
.h-name{fill:var(--text);font:500 19px var(--font, inherit)}
.h-pill{fill:var(--panel2);stroke:var(--line);stroke-width:1}
.h-v{fill:var(--text);font:600 19px var(--mono)}
.h-v.lv-warn{fill:var(--warn)}
.h-v.lv-crit{fill:var(--crit)}
.s-stop .h-v.lv-ok,.s-maint .h-v.lv-ok{fill:var(--muted)}
.h-u{fill:var(--muted);font:16px var(--font, inherit)}
/* desen utilaje: inox = panel2 / line-strong, contur 1px muted, detalii text */
.h-mach{pointer-events:none}
.s-stop .h-mach,.s-maint .h-mach{opacity:.75}
.m-b{fill:var(--panel2);stroke:var(--muted);stroke-width:1}
.m-d{fill:var(--line-strong, var(--line));stroke:var(--muted);stroke-width:1}
.m-w{fill:var(--bg);stroke:var(--muted);stroke-width:1}
.m-l{fill:none;stroke:var(--muted);stroke-width:1}
.m-faint{stroke-opacity:.45}
.m-pipe{stroke-width:2}
.m-t{fill:var(--text);stroke:none}
.m-tl{fill:none;stroke:var(--text);stroke-width:1.2}
.m-thick{stroke-width:2.5;stroke-linecap:round}
.m-p{fill:var(--muted);stroke:none}
.m-belt{fill:none;stroke:var(--text);stroke-width:1.2;stroke-dasharray:4 4}
.m-spin{transform-box:fill-box;transform-origin:center}
.m-smoke{fill:var(--line-strong, var(--line));opacity:0;transform-box:fill-box;transform-origin:center}
.s-run .m-spin{animation:h-rot 1.4s linear infinite}
.s-run .m-belt{animation:h-belt .7s linear infinite}
.s-run .m-smoke{animation:h-smoke 2.1s ease-out infinite}
@keyframes h-dash{to{stroke-dashoffset:-11}}
@keyframes h-belt{to{stroke-dashoffset:-8}}
@keyframes h-move{from{transform:translateX(0)}to{transform:translateX(10px)}}
@keyframes h-rot{to{transform:rotate(360deg)}}
@keyframes h-smoke{0%{opacity:0;transform:translateY(0) scale(.6)}25%{opacity:.8}100%{opacity:0;transform:translateY(-16px) scale(1.6)}}
@keyframes h-blink{50%{opacity:.3}}
@media (prefers-reduced-motion:reduce){.h-arw *,.h-halo,.m-spin,.m-belt,.m-smoke{animation:none!important}}

/* panou lateral */
.h-ph{display:flex;gap:10px;justify-content:space-between;align-items:flex-start;padding:14px;border-bottom:1px solid var(--line);background:var(--panel2)}
.h-pt{font-weight:700;font-size:15px;line-height:1.3}
.h-ps{color:var(--muted);font-size:12px;margin-top:2px}
.h-ph .pill{flex:none;margin-top:2px}
.h-pb{padding:12px 14px 14px;display:grid;gap:10px}
.h-sec{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:600;margin-top:4px}
.h-fault{background:var(--panel);border:1px solid var(--crit);color:var(--crit);border-radius:var(--radius);padding:8px 10px;font-size:13px}
.h-meta{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.h-meta div{background:var(--bg);border:1px solid var(--line);border-radius:var(--radius);padding:5px 9px;min-width:0}
.h-meta small{display:block;color:var(--muted);font-size:11px}
.h-meta b{font-family:var(--mono);font-size:13px;font-weight:600}
.h-prm{background:var(--bg);border:1px solid var(--line);border-left:3px solid var(--ok);border-radius:var(--radius);padding:7px 10px}
.h-prm.h-pw{border-left-color:var(--warn)}
.h-prm.h-pc{border-left-color:var(--crit)}
.h-prm-top{display:flex;align-items:baseline;gap:6px}
.h-prm-l{flex:1;color:var(--muted);font-size:12px;min-width:0}
.h-prm-v{font-size:18px;font-weight:700}
.h-prm-u{color:var(--muted);font-size:12px;min-width:20px}
.h-prm-bot{display:flex;align-items:center;gap:8px;margin-top:3px}
.h-spark{width:96px;height:26px;flex:none;background:var(--panel2);border-radius:4px}
.h-spark polyline{fill:none;stroke:var(--accent);stroke-width:1.5;vector-effect:non-scaling-stroke}
.h-spark polyline.lv-warn{stroke:var(--warn)}
.h-spark polyline.lv-crit{stroke:var(--crit)}
.h-spark line{stroke:var(--muted);stroke-opacity:.45;stroke-dasharray:3 3;vector-effect:non-scaling-stroke}
.h-lim{flex:1;font-size:11px;color:var(--muted);min-width:0}
.h-lim b{color:var(--accent);font-weight:600}
.h-spb{display:flex;gap:4px}
.h-spb button{padding:2px 10px;line-height:1.3;font-weight:700}
.h-ctl{display:flex;flex-wrap:wrap;gap:6px}
.h-ctl button{flex:1 1 auto}
.h-row{display:flex;align-items:center;gap:10px;font-size:13px}
.h-row label{color:var(--muted);min-width:70px}
.h-row input[type=range]{flex:1;accent-color:var(--accent);padding:0}
.h-row select{flex:1}
.h-row b{font-family:var(--mono);min-width:44px;text-align:right}
.h-open{width:100%}
.h-empty{padding:22px 16px 10px;text-align:center;color:var(--muted)}
.h-empty svg{width:42px;height:42px;color:var(--accent);opacity:.8}
.h-empty p{margin:6px 0 0;font-size:13px}
.h-attn{display:grid;gap:6px}
.h-att{display:flex;align-items:center;gap:6px;text-align:left;width:100%;font-size:13px}
.h-att span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.h-att small{color:var(--muted);font-size:11px;flex:0 1 auto;max-width:45%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.h-ok{color:var(--ok);font-size:13px}
.h-deps{display:flex;flex-wrap:wrap;gap:6px}
.h-deps .dep-btn{height:30px;font-size:12.5px}
.h-prm .h-lim{margin-top:2px}
`;

  // ---------- ilustratii utilaje (cutie locala 140 x 70, vedere frontala / 3/4, stil plat)
  const spinG = (cx, cy, r, inner) => `<g class="m-spin"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="none"/>${inner}</g>`;
  function blades(cx, cy, r, n) {
    let s = "";
    for (let i = 0; i < (n || 3); i++) s += `<path class="m-p" d="M${cx} ${cy}Q${cx + r * 0.55} ${cy - r * 0.45} ${cx + r * 0.15} ${cy - r}Q${cx - r * 0.4} ${cy - r * 0.6} ${cx} ${cy}Z" transform="rotate(${i * 360 / (n || 3)} ${cx} ${cy})"/>`;
    return s;
  }
  const fan = (cx, cy, r) => `<circle class="m-w" cx="${cx}" cy="${cy}" r="${r}"/>` + spinG(cx, cy, r - 0.8, blades(cx, cy, r - 1));
  const cross = (cx, cy, r) => spinG(cx, cy, r, `<path class="m-tl" d="M${cx - r} ${cy}H${cx + r}M${cx} ${cy - r}V${cy + r}"/>`);
  const smoke = (cx, cy) => [0, -0.7, -1.4].map(d => `<circle class="m-smoke" cx="${cx}" cy="${cy}" r="3.2" style="animation-delay:${d}s"/>`).join("");
  const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");

  function machine(eq) {
    const id = eq.id;
    switch (eq.type) {
      case "camera": {
        let s = `<rect class="m-b" x="8" y="20" width="124" height="46" rx="2"/>
          <path class="m-l m-faint" d="M38 20V66M100 20V66"/>
          <rect class="m-d" x="44" y="6" width="52" height="14" rx="2"/>${fan(58, 13, 5)}${fan(82, 13, 5)}
          <path class="m-l" d="M12 25H62"/><rect class="m-b" x="16" y="27" width="34" height="39"/><rect class="m-t" x="44" y="42" width="2" height="9"/>
          <rect class="m-w" x="66" y="28" width="58" height="30" rx="1"/>`;
        if (/^MAT/.test(id)) s += `<path class="m-l" d="M68 32H122"/>` + rep(8, i => `<rect class="m-p" x="${70.5 + i * 6.6}" y="33" width="3" height="${15 + (i % 2) * 5}" rx="1.5"/>`);
        else if (id === "DEP01") s += `<path class="m-l" d="M69 28V58M95 28V58M121 28V58M67 43H123"/>` + [31, 46].map(yy => [72, 81, 98, 107].map(xx => `<rect class="m-d" x="${xx}" y="${yy}" width="8" height="10"/>`).join("")).join("");
        else s += `<path class="m-l" d="M68 32H122"/>` + rep(4, i => `<path class="m-p" d="M${76 + i * 13} 33v3c-4 2-5 8-3 14 2 4 6 4 8 0 2-6 1-12-3-14z"/>`);
        return s;
      }
      case "cantar":
        return `<path class="m-b" d="M14 54H108L124 44H30Z"/><rect class="m-d" x="14" y="54" width="94" height="6"/><path class="m-d" d="M108 54 124 44V50L108 60Z"/>
          <rect class="m-b" x="44" y="30" width="44" height="18" rx="1"/><path class="m-l" d="M44 36H88M44 42H88"/>
          <rect class="m-d" x="120" y="16" width="4" height="30"/><rect class="m-d" x="106" y="4" width="30" height="14" rx="2"/><rect class="m-t" x="109" y="7" width="24" height="8" rx="1"/>`;
      case "tocator":
        return `<rect class="m-d" x="18" y="46" width="80" height="16" rx="2"/><path class="m-l m-faint" d="M30 50V58M38 50V58M46 50V58M54 50V58"/>
          <rect class="m-d" x="24" y="62" width="6" height="4"/><rect class="m-d" x="86" y="62" width="6" height="4"/>
          <path class="m-b" d="M28 4H80L68 26H40Z"/>
          <rect class="m-b" x="34" y="26" width="70" height="18" rx="3"/><path class="m-belt" d="M38 35H100"/>
          <rect class="m-d" x="104" y="24" width="8" height="22" rx="1"/>
          <circle class="m-b" cx="119" cy="35" r="10"/><circle class="m-w" cx="119" cy="35" r="6"/>${cross(119, 35, 6)}
          <path class="m-l" d="M116 46 132 62"/>`;
      case "cutter":
        return `<rect class="m-d" x="16" y="40" width="108" height="24" rx="3"/>
          <path class="m-b" d="M18 34Q70 66 122 34Z"/>
          <ellipse class="m-b" cx="70" cy="34" rx="52" ry="12"/><ellipse class="m-w" cx="70" cy="34" rx="40" ry="8"/>
          <ellipse class="m-belt" cx="70" cy="34" rx="30" ry="5"/>
          <path class="m-d" d="M74 27Q98 8 122 31V34Q98 26 74 31Z"/>
          <rect class="m-d" x="60" y="27" width="4" height="10"/>
          <rect class="m-b" x="100" y="45" width="18" height="12" rx="1"/><rect class="m-t" x="103" y="48" width="12" height="4"/>`;
      case "malaxor":
        return `<path class="m-d" d="M16 24 34 4H122L124 24Z"/>
          <path class="m-b" d="M12 24H128L122 54Q70 66 18 54Z"/>
          <path class="m-w" d="M18 27H122L118 48Q70 58 22 48Z"/>
          <path class="m-l" d="M24 35H116M24 44H116"/>
          ${[36, 56, 76, 96].map(c => cross(c, 35, 4.5)).join("")}${[46, 66, 86, 106].map(c => cross(c, 44, 4.5)).join("")}
          <rect class="m-d" x="22" y="58" width="6" height="8"/><rect class="m-d" x="112" y="58" width="6" height="8"/>
          <rect class="m-d" x="126" y="32" width="12" height="18" rx="2"/>`;
      case "umplere":
        return `<path class="m-b" d="M14 4H62L56 30H20Z"/><ellipse class="m-w" cx="38" cy="5" rx="23" ry="2.5"/>
          <rect class="m-b" x="10" y="30" width="56" height="36" rx="2"/>
          <rect class="m-d" x="15" y="36" width="18" height="11" rx="1"/><rect class="m-t" x="17" y="38" width="14" height="4"/>
          <circle class="m-d" cx="50" cy="50" r="9"/>${cross(50, 50, 6)}
          <rect class="m-d" x="66" y="40" width="26" height="5" rx="2"/>
          <rect class="m-b" x="92" y="24" width="26" height="42" rx="2"/><rect class="m-w" x="96" y="30" width="18" height="14"/><path class="m-tl" d="M99 37H111"/>
          <ellipse class="m-p" cx="124" cy="56" rx="4.2" ry="3.2"/><ellipse class="m-p" cx="133" cy="56" rx="4.2" ry="3.2"/>`;
      case "celula":
        return `<rect class="m-d" x="80" y="4" width="8" height="12"/>${smoke(84, 2)}
          <rect class="m-b" x="22" y="16" width="84" height="50" rx="2"/>
          <rect class="m-w" x="30" y="22" width="46" height="40" rx="1"/>
          <path class="m-l" d="M34 26H72M34 39H72M36 26V60M70 26V60"/>
          ${rep(6, i => `<rect class="m-p" x="${38.5 + i * 5.3}" y="27" width="2.6" height="10" rx="1.3"/><rect class="m-p" x="${38.5 + i * 5.3}" y="40" width="2.6" height="10" rx="1.3"/>`)}
          <circle class="m-d" cx="38" cy="61" r="1.6"/><circle class="m-d" cx="68" cy="61" r="1.6"/>
          <rect class="m-t" x="80" y="36" width="3" height="12" rx="1"/>
          <rect class="m-b" x="108" y="24" width="20" height="30" rx="1"/><rect class="m-t" x="111" y="27" width="14" height="6"/>
          <circle class="m-d" cx="114" cy="40" r="2"/><circle class="m-d" cx="122" cy="40" r="2"/>`;
      case "tunel":
        return `<rect class="m-d" x="56" y="4" width="28" height="10" rx="1"/>${fan(70, 9, 4)}
          <path class="m-b" d="M22 46V22Q22 14 30 14H110Q118 14 118 22V46Z"/>
          <path class="m-l m-faint" d="M42 14V46M62 14V46M82 14V46M102 14V46"/>
          <rect class="m-d" x="4" y="46" width="132" height="6" rx="3"/><path class="m-belt" d="M8 46H132"/>
          <rect class="m-p" x="7" y="40" width="10" height="6" rx="1"/><rect class="m-p" x="123" y="40" width="10" height="6" rx="1"/>
          ${[14, 34, 54, 74, 94, 114].map(c => spinG(c, 58, 3.5, `<circle class="m-w" cx="${c}" cy="58" r="3.5"/><path class="m-tl" d="M${c - 3.5} 58H${c + 3.5}"/>`)).join("")}
          <rect class="m-d" x="4" y="56" width="4" height="10"/><rect class="m-d" x="132" y="56" width="4" height="10"/>`;
      case "feliere":
        return `<rect class="m-b" x="8" y="40" width="72" height="26" rx="2"/>
          <rect class="m-d" x="14" y="46" width="16" height="10" rx="1"/><rect class="m-t" x="16" y="48" width="12" height="4"/>
          <path class="m-d" d="M8 32 28 14H38L20 34Z"/>
          <circle class="m-b" cx="48" cy="28" r="16"/>${spinG(48, 28, 13, `<circle class="m-w" cx="48" cy="28" r="13"/><path class="m-tl" d="M48 15V41M35 28H61"/>`)}
          <path class="m-d" d="M32 28A16 16 0 0 1 64 28H60A12 12 0 0 0 36 28Z"/>
          <rect class="m-d" x="80" y="44" width="56" height="5" rx="2.5"/><path class="m-belt" d="M82 44H134"/>
          ${rep(5, i => `<ellipse class="m-p" cx="${89 + i * 9}" cy="41.5" rx="5" ry="2.5"/>`)}
          <rect class="m-d" x="124" y="49" width="4" height="17"/>`;
      case "ambalare":
        return `<rect class="m-d" x="30" y="18" width="24" height="10" rx="1"/><rect class="m-d" x="64" y="18" width="24" height="10" rx="1"/>
          <circle class="m-d" cx="110" cy="14" r="9"/>${spinG(110, 14, 8, `<circle class="m-w" cx="110" cy="14" r="3"/><path class="m-tl" d="M110 6V22"/>`)}
          <path class="m-l" d="M102 18 92 28"/>
          <rect class="m-b" x="6" y="28" width="128" height="26" rx="2"/><path class="m-belt" d="M8 28H132"/>
          ${rep(5, i => `<rect class="m-w" x="${12 + i * 20}" y="34" width="14" height="8" rx="1"/>`)}
          <rect class="m-t" x="116" y="34" width="12" height="6"/>
          <circle class="m-d" cx="16" cy="60" r="6"/>${cross(16, 60, 4)}
          <rect class="m-d" x="40" y="54" width="4" height="12"/><rect class="m-d" x="110" y="54" width="4" height="12"/>`;
      case "detector":
        return `<rect class="m-d" x="4" y="46" width="132" height="5" rx="2.5"/><path class="m-belt" d="M8 46H132"/>
          <path class="m-b" d="M46 46V16H94V46H86V24H54V46Z"/>
          <rect class="m-d" x="60" y="4" width="20" height="10" rx="1"/><circle class="m-t" cx="70" cy="9" r="2"/>
          <rect class="m-p" x="16" y="40" width="10" height="6" rx="1"/><rect class="m-p" x="62" y="40" width="10" height="6" rx="1"/>
          <path class="m-b" d="M106 54H128L126 66H108Z"/>
          <rect class="m-d" x="10" y="51" width="4" height="15"/><rect class="m-d" x="130" y="51" width="4" height="15"/>`;
      case "rampa":
        return `<rect class="m-b" x="4" y="8" width="132" height="44" rx="1"/>
          ${rep(3, i => { const dx = 12 + i * 42; return `<rect class="m-w" x="${dx}" y="16" width="32" height="36"/><path class="m-l m-faint" d="M${dx} 25H${dx + 32}M${dx} 34H${dx + 32}M${dx} 43H${dx + 32}"/>`; })}
          <rect class="m-d" x="2" y="52" width="136" height="6"/>
          <rect class="m-b" x="52" y="28" width="36" height="30" rx="1"/><path class="m-l" d="M70 28V58"/>
          <rect class="m-t" x="65" y="38" width="2" height="8"/><rect class="m-t" x="73" y="38" width="2" height="8"/>
          <rect class="m-d" x="50" y="58" width="40" height="3"/><circle class="m-d" cx="58" cy="64" r="3.5"/><circle class="m-d" cx="82" cy="64" r="3.5"/>`;
      case "compresor":
        return `<rect class="m-d" x="6" y="56" width="128" height="6" rx="1"/>
          <rect class="m-b" x="26" y="32" width="36" height="24" rx="4"/><path class="m-l m-faint" d="M34 34V54M40 34V54M46 34V54M52 34V54M58 34V54"/>
          <circle class="m-b" cx="18" cy="44" r="11"/>${spinG(18, 44, 9.5, blades(18, 44, 9.5))}
          <rect class="m-d" x="62" y="40" width="8" height="8"/>
          <rect class="m-b" x="70" y="28" width="38" height="28" rx="2"/><rect class="m-d" x="74" y="20" width="30" height="8" rx="1"/>
          <path class="m-l m-pipe" d="M89 20V8H126V56"/>
          <circle class="m-w" cx="114" cy="8" r="5"/><path class="m-tl" d="M114 8l3-3"/>`;
      case "cazan":
        return `<rect class="m-d" x="26" y="4" width="8" height="20"/>${smoke(30, 2)}
          <rect class="m-b" x="16" y="22" width="96" height="34" rx="17"/>
          <path class="m-l m-faint" d="M44 22V56M68 22V56M92 22V56"/>
          <ellipse class="m-d" cx="110" cy="39" rx="6" ry="15"/>
          <rect class="m-b" x="114" y="31" width="20" height="16" rx="2"/>${fan(124, 39, 5)}
          <path class="m-l m-pipe" d="M70 22V12H102"/><path class="m-d" d="M94 8 102 16V8L94 16Z"/>
          <rect class="m-d" x="32" y="56" width="12" height="10"/><rect class="m-d" x="84" y="56" width="12" height="10"/>`;
      case "electric":
        return `<rect class="m-b" x="6" y="26" width="48" height="40" rx="2"/>
          <path class="m-l m-faint" d="M12 30V62M18 30V62M24 30V62M30 30V62M36 30V62M42 30V62M48 30V62"/>
          ${[16, 30, 44].map(c => `<rect class="m-d" x="${c - 2}" y="10" width="4" height="16"/><path class="m-l" d="M${c - 4} 14H${c + 4}M${c - 4} 18H${c + 4}M${c - 4} 22H${c + 4}"/><circle class="m-t" cx="${c}" cy="9" r="1.6"/>`).join("")}
          ${rep(3, i => { const cx = 62 + i * 25; return `<rect class="m-b" x="${cx}" y="12" width="23" height="54" rx="1"/><rect class="m-t" x="${cx + 4}" y="17" width="15" height="6"/><path class="m-l" d="M${cx + 11.5} 28V62"/><circle class="m-d" cx="${cx + 7}" cy="32" r="1.8"/><circle class="m-d" cx="${cx + 16}" cy="32" r="1.8"/>`; })}`;
      case "apa": {
        let s = id === "EPU01"
          ? `<path class="m-b" d="M6 30H70V62H6Z"/><path class="m-w" d="M9 34H67V59H9Z"/><path class="m-l" d="M10 38q5-3 10 0t10 0t10 0t10 0t10 0"/>${cross(38, 49, 6)}`
          : [22, 50].map(c => `<rect class="m-b" x="${c - 12}" y="10" width="24" height="50" rx="4"/><ellipse class="m-w" cx="${c}" cy="12" rx="11" ry="2.5"/><path class="m-l m-faint" d="M${c - 12} 24H${c + 12}M${c - 12} 46H${c + 12}"/>`).join("");
        s += `<path class="m-l m-pipe" d="M${id === "EPU01" ? 70 : 62} 48H91M109 48H134M121 48V40"/>
          <circle class="m-b" cx="100" cy="48" r="9"/>${spinG(100, 48, 7, blades(100, 48, 7))}
          <rect class="m-b" x="114" y="10" width="14" height="30" rx="7"/>
          <rect class="m-d" x="4" y="61" width="132" height="5"/>`;
        return s;
      }
      case "laborator":
        return `<rect class="m-d" x="4" y="38" width="132" height="5" rx="1"/>
          <rect class="m-b" x="8" y="43" width="40" height="23"/><rect class="m-b" x="92" y="43" width="40" height="23"/><path class="m-l" d="M28 43V66M112 43V66"/>
          <rect class="m-d" x="14" y="32" width="20" height="6" rx="1"/><path class="m-tl m-thick" d="M29 32V18L23 10"/><rect class="m-d" x="17" y="22" width="11" height="4"/><path class="m-tl m-thick" d="M23 10 19 4"/>
          <path class="m-w" d="M54 14H62V22L70 38H46L54 22Z"/><path class="m-p" d="M50 30H66L70 38H46Z"/>
          ${rep(4, i => `<rect class="m-w" x="${76 + i * 5}" y="22" width="3" height="16" rx="1.5"/><rect class="m-p" x="${76 + i * 5}" y="31" width="3" height="7" rx="1.5"/>`)}
          <rect class="m-d" x="102" y="12" width="28" height="20" rx="2"/><rect class="m-w" x="104" y="14" width="24" height="15"/><path class="m-tl" d="M106 25l5-5 4 3 6-7 5 4"/><rect class="m-d" x="114" y="32" width="4" height="6"/>`;
      default:
        return `<rect class="m-b" x="20" y="16" width="100" height="50" rx="4"/>`;
    }
  }

  // ---------- plan: 7 pasi de flux + ramura maturare + utilitati (nu foloseste coordonatele din data.js)
  const SHORT = {
    CF01: ["Cameră frig MP", "temp"], CN01: ["Cântar recepție", "debit"], TOC01: ["Tocător", "turatie"], CUT01: ["Cutter", "turatie"],
    MAL01: ["Malaxor", "turatie"], UMP01: ["Umplere", "cadenta"], AF01: ["Celulă 1", "temp"], AF02: ["Celulă 2", "temp"],
    TR01: ["Tunel răcire", "temp"], FEL01: ["Feliere", "cadenta"], AMB01: ["Ambalare MAP", "cadenta"], DM01: ["Detector metale", "rejecturi"],
    DEP01: ["Depozit PF", "temp"], RMP01: ["Rampă", "temp"], MAT01: ["Maturare 1", "temp"], MAT02: ["Maturare 2", "temp"],
    FRG01: ["Stație frig NH3", "pAsp"], CAZ01: ["Centrală abur", "presiune"], AER01: ["Aer comprimat", "presiune"], PT01: ["Post trafo", "putere"],
    APA01: ["Tratare apă", "debit"], EPU01: ["Epurare", "ph"], LAB01: ["Laborator", "probe"]
  };
  const STEPS = [["Recepție"], ["Procesare"], ["Umplere"], ["Tratament", "termic"], ["Răcire"], ["Feliere &", "ambalare"], ["Depozit &", "expediție"]];
  const STEP_EQ = [["CF01", "CN01"], ["TOC01", "CUT01", "MAL01"], ["UMP01"], ["AF01", "AF02"], ["TR01"], ["FEL01", "AMB01", "DM01"], ["DEP01", "RMP01"]];
  const BRANCH = ["MAT01", "MAT02"];
  const UTIL = ["FRG01", "CAZ01", "AER01", "PT01", "APA01", "EPU01", "LAB01"];
  const COL = { x0: 20, w: 198, gap: 28, y: 50, head: 96, h: 556 };
  const TILE = { w: 184, h: 140, gap: 12 };
  const colX = i => COL.x0 + i * (COL.w + COL.gap);
  const WORLD = { w: colX(6) + COL.w + 20, h: 1036 };
  const L = {}; // id -> {x,y,w,h}
  STEP_EQ.forEach((ids, i) => {
    const area = COL.h - COL.head - 16, stack = ids.length * TILE.h + (ids.length - 1) * TILE.gap;
    const y0 = COL.y + COL.head + (area - stack) / 2;
    ids.forEach((id, k) => { L[id] = { x: colX(i) + 7, y: y0 + k * (TILE.h + TILE.gap), w: TILE.w, h: TILE.h }; });
  });
  const BR = { x: colX(3), y: COL.y + COL.h + 32, w: colX(4) + COL.w - colX(3), h: 190 };
  BRANCH.forEach((id, k) => { const w = (BR.w - 30) / 2; L[id] = { x: BR.x + 10 + k * (w + 10), y: BR.y + 40, w, h: TILE.h }; });
  const UT = { x: COL.x0, y: 878, w: colX(6) + COL.w - COL.x0, h: 142 };
  UTIL.forEach((id, k) => { const w = (UT.w - 20 - 60) / 7; L[id] = { x: UT.x + 10 + k * (w + 10), y: UT.y + 6, w, h: 130 }; });

  function tileSVG(eq) {
    const t = L[eq.id]; if (!t) return null;
    const { x, y, w, h } = t, dh = h - 66;
    const p = eq.params.find(q => q.key === (SHORT[eq.id] || [])[1]) || eq.params[0];
    const sc = Math.min((w - 16) / 140, (dh - 6) / 70);
    const mx = x + (w - 140 * sc) / 2, my = y + 31 + (dh - 70 * sc) / 2;
    let s = `<g class="h-eq" data-id="${eq.id}" tabindex="0" role="button" aria-label="${esc(eq.name)}"><title>${esc(eq.id + " – " + eq.name)}</title>`;
    s += `<rect class="h-selr" x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" rx="10"/>`;
    s += `<rect class="h-hit" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>`;
    s += `<rect class="h-pad" x="${x + 2}" y="${y + 29}" width="${w - 4}" height="${dh + 4}" rx="8"/>`;
    s += `<rect class="h-halo" x="${x + 2}" y="${y + 29}" width="${w - 4}" height="${dh + 4}" rx="8"/>`;
    s += `<circle class="h-dot" cx="${x + 9}" cy="${y + 14}" r="5.5"/>`;
    s += `<text class="h-name" x="${x + 21}" y="${y + 20.5}">${esc((SHORT[eq.id] || [eq.id])[0])}</text>`;
    s += `<g class="h-mach" transform="translate(${mx.toFixed(1)} ${my.toFixed(1)}) scale(${sc.toFixed(3)})">${machine(eq)}</g>`;
    if (p) {
      const vl = Math.max(E.fmt(p.max).length, E.fmt(p.min).length, 4);
      const pw = Math.min(w - 6, vl * 11.6 + p.unit.length * 9.4 + 30), py = y + 31 + dh + 4;
      s += `<rect class="h-pill" x="${(x + w / 2 - pw / 2).toFixed(1)}" y="${py}" width="${pw.toFixed(1)}" height="30" rx="15"/>`;
      s += `<text x="${x + w / 2}" y="${py + 21}" text-anchor="middle"><tspan class="h-v" data-v></tspan>${p.unit ? `<tspan class="h-u" dx="4">${esc(p.unit)}</tspan>` : ""}</text>`;
    }
    s += `</g>`;
    return { s, p };
  }

  function arrow(x1, y1, x2, y2, srcs) {
    return `<g class="h-arw" data-src="${srcs.join(",")}"><line x1="${x1}" y1="${y1}" x2="${x2 - 7}" y2="${y2}"/><path d="M${x2 - 9} ${y2 - 6} ${x2} ${y2} ${x2 - 9} ${y2 + 6}Z"/><circle class="h-puls" cx="${x1 + 3}" cy="${y1}" r="2.5"/></g>`;
  }

  function buildSVG() {
    let s = `<svg class="h-map" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plan hală: flux de producție și utilități">
      <defs><pattern id="h-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" style="fill:var(--line-strong, var(--line))"/></pattern></defs>
      <rect x="-4000" y="-4000" width="10000" height="10000" fill="url(#h-dots)"/>`;
    s += `<text class="h-band" x="${COL.x0}" y="34">FLUX DE PRODUCȚIE</text>`;
    STEPS.forEach((t, i) => {
      const x = colX(i);
      s += `<rect class="h-col" x="${x}" y="${COL.y}" width="${COL.w}" height="${COL.h}" rx="6"/>`;
      s += `<path class="h-wall" d="M${x} ${COL.y + COL.head - 8}H${x + COL.w}"/>`;
      s += `<text class="h-stepn" x="${x + 12}" y="${COL.y + 34}">${i + 1}</text>`;
      t.forEach((ln, k) => { s += `<text class="h-stept" x="${x + 12}" y="${COL.y + 60 + k * 22}">${esc(ln)}</text>`; });
    });
    const ay = COL.y + COL.head + (COL.h - COL.head - 16) / 2;
    for (let i = 0; i < 6; i++) s += arrow(colX(i) + COL.w + 5, ay, colX(i + 1) - 5, ay, STEP_EQ[i]);
    // ramura maturare crud-uscate: din pasul 3 in jos, apoi inapoi sus in pasul 6
    const c3 = colX(2) + COL.w / 2, c6 = colX(5) + COL.w / 2, my = BR.y + 40 + TILE.h / 2, bot = COL.y + COL.h;
    s += `<rect class="h-col h-brbox" x="${BR.x}" y="${BR.y}" width="${BR.w}" height="${BR.h}" rx="6"/>`;
    s += `<text class="h-stept" x="${BR.x + 12}" y="${BR.y + 28}">Maturare crud-uscate</text>`;
    s += `<g class="h-arw h-br" data-src="UMP01"><path class="h-brl" d="M${c3} ${bot + 4}V${my}H${BR.x - 8}"/><path d="M${BR.x - 9} ${my - 6} ${BR.x} ${my} ${BR.x - 9} ${my + 6}Z"/></g>`;
    s += `<g class="h-arw h-br" data-src="MAT01,MAT02"><path class="h-brl" d="M${BR.x + BR.w} ${my}H${c6}V${bot + 9}"/><path d="M${c6 - 6} ${bot + 9} ${c6} ${bot} ${c6 + 6} ${bot + 9}Z"/></g>`;
    s += `<text class="h-band" x="${COL.x0}" y="${UT.y - 12}">UTILITĂȚI</text>`;
    s += `<rect class="h-col" x="${UT.x}" y="${UT.y}" width="${UT.w}" height="${UT.h}" rx="6"/>`;
    const vals = {};
    for (const eq of E.equipment) { const r = tileSVG(eq); if (r) { s += r.s; vals[eq.id] = r.p; } }
    s += `</svg>`;
    return { s, vals };
  }

  // ---------- canvas: pan / zoom prin viewBox
  const cvs = { el: null, x: 0, y: 0, k: 1, fit: 1, fitted: false, lbl: null };
  const clampK = k => Math.max(Math.min(0.6, cvs.fit), Math.min(2.5, k));
  function cvApply() {
    const cw = cvs.el.clientWidth, ch = cvs.el.clientHeight; if (!cw || !ch) return;
    svg.setAttribute("viewBox", `${cvs.x.toFixed(1)} ${cvs.y.toFixed(1)} ${(cw / cvs.k).toFixed(1)} ${(ch / cvs.k).toFixed(1)}`);
    cvs.lbl.textContent = Math.round(cvs.k * 100) + "%";
  }
  function cvFit(auto) {
    const cw = cvs.el.clientWidth, ch = cvs.el.clientHeight; if (!cw || !ch) return false;
    cvs.fit = Math.min(cw / (WORLD.w + 16), ch / (WORLD.h + 16));
    cvs.k = cvs.fit; cvs.x = (WORLD.w - cw / cvs.k) / 2; cvs.y = (WORLD.h - ch / cvs.k) / 2;
    if (auto && cvs.fit < 0.45) { cvs.k = 0.6; cvs.x = 0; cvs.y = 0; } // ecran mic: pornim lizibil, utilizatorul deplaseaza
    cvs.fitted = true; cvs.user = false; cvApply(); return true;
  }
  function cvZoom(f, px, py) {
    cvs.user = true;
    const nk = clampK(cvs.k * f), wx = cvs.x + px / cvs.k, wy = cvs.y + py / cvs.k;
    cvs.k = nk; cvs.x = wx - px / nk; cvs.y = wy - py / nk; cvApply();
  }
  function cvInit(el) {
    cvs.el = el; cvs.lbl = root.querySelector("[data-z]");
    const pts = new Map(); let drag = null, pinch = null;
    const local = e => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const two = () => { const a = [...pts.values()]; return { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1, x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; };
    root.querySelector(".h-zoom").addEventListener("click", e => {
      const b = e.target.closest("[data-zoom]"); if (!b) return;
      const z = b.dataset.zoom;
      if (z === "fit") cvFit(); else cvZoom(z === "in" ? 1.25 : 0.8, el.clientWidth / 2, el.clientHeight / 2);
    });
    el.addEventListener("pointerdown", e => {
      if (e.target.closest(".h-zoom") || (e.pointerType === "mouse" && e.button !== 0)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignorat */ }
      if (pts.size === 1) drag = { sx: e.clientX, sy: e.clientY, ox: cvs.x, oy: cvs.y, moved: false, target: e.target };
      else if (pts.size === 2) { if (drag) drag.moved = true; const t = two(); pinch = { d: t.d, k: cvs.k, x: t.x, y: t.y }; }
    });
    el.addEventListener("pointermove", e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size >= 2 && pinch) {
        const t = two(), r = el.getBoundingClientRect();
        cvs.x -= (t.x - pinch.x) / cvs.k; cvs.y -= (t.y - pinch.y) / cvs.k; pinch.x = t.x; pinch.y = t.y;
        cvZoom(clampK(pinch.k * t.d / pinch.d) / cvs.k, t.x - r.left, t.y - r.top);
      } else if (drag) {
        const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
        if (!drag.moved && Math.hypot(dx, dy) > 4) { drag.moved = true; cvs.user = true; el.classList.add("h-drag"); }
        if (drag.moved) { cvs.x = drag.ox - dx / cvs.k; cvs.y = drag.oy - dy / cvs.k; cvApply(); }
      }
    });
    const end = e => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size === 0) {
        if (drag && !drag.moved && e.type === "pointerup") pickFromMap(drag.target.closest ? drag.target.closest(".h-eq") : null);
        drag = null; pinch = null; el.classList.remove("h-drag");
      } else if (pts.size === 1) {
        const p = [...pts.values()][0]; pinch = null;
        drag = { sx: p.x, sy: p.y, ox: cvs.x, oy: cvs.y, moved: true, target: null };
      }
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("wheel", e => {
      e.preventDefault();
      const [px, py] = local(e);
      cvZoom(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015)), px, py);
    }, { passive: false });
    const onResize = () => { if (!cvs.fitted || !cvs.user) cvFit(true); else cvApply(); };
    if (window.ResizeObserver) new ResizeObserver(onResize).observe(el); else window.addEventListener("resize", onResize);
  }

  // ---------- panou lateral (doar citire)
  function depsFor(eq) {
    return DEPTS.filter(d => d[2] && d[2](eq)).map(d => d[1]);
  }

  function panelHTML(eq) {
    const z = zoneById[eq.zone] || { id: eq.zone, name: "" };
    const rows = eq.params.map(p => `
      <div class="h-prm" data-k="${p.key}">
        <div class="h-prm-top"><span class="h-prm-l">${esc(p.label)}</span><span class="h-prm-v mono" data-v></span><span class="h-prm-u">${esc(p.unit)}</span></div>
        <div class="h-lim mono">limite ${E.fmt(p.lo)} … ${E.fmt(p.hi)} ${esc(p.unit)} · referință <b>${E.fmt(p.sp)}</b></div>
      </div>`).join("");
    const st = eq.status;
    const deps = depsFor(eq);
    return `
      <div class="h-ph">
        <div><div class="h-pt">${esc(eq.name)}</div><div class="h-ps">${eq.id} · ${esc(z.id)} ${esc(z.name)}</div></div>
        <span class="pill st-${st}">${U.statusLabel[st] || st}</span>
      </div>
      <div class="h-pb">
        <div class="h-meta">
          <div><small>Ore funcționare</small><b data-rh></b></div>
          <div><small>MTBF / MTTR</small><b>${eq.mtbf} h / ${eq.mttr} h</b></div>
          <div><small>Ultima mentenanță</small><b>${U.date(eq.lastMaint)}</b></div>
          <div><small>Următoarea mentenanță</small><b>${U.date(eq.nextMaint)}</b></div>
        </div>
        <div class="h-sec">Parametri</div>
        ${rows || `<div class="h-ps">Fără parametri măsurați.</div>`}
        <div class="h-sec">Ce departamente folosesc datele acestui utilaj</div>
        <div class="h-deps">${deps.map(d => `<button class="dep-btn" data-dep="${esc(d)}">${esc(d)}</button>`).join("") || `<span class="h-ps">—</span>`}</div>
      </div>`;
  }

  function emptyHTML() {
    return `
      <div class="h-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3l7 17 2.5-7.5L21 10z"/></svg>
        <div class="h-pt" style="color:var(--text)">Niciun utilaj selectat</div>
        <p>Faceți clic pe un utilaj de pe hartă pentru parametri și departamentele care îi folosesc datele.</p>
      </div>
      <div class="h-pb"><div class="h-sec">Necesită atenție</div><div class="h-attn"></div></div>`;
  }

  function bindPanel(eq) {
    panel = { rows: [], rh: side.querySelector("[data-rh]") };
    if (!eq) return;
    side.querySelectorAll(".h-prm").forEach(row => {
      const p = eq.params.find(q => q.key === row.dataset.k);
      panel.rows.push({ p, row, v: row.querySelector("[data-v]") });
    });
  }

  function updatePanel(eq) {
    if (panel.rh) panel.rh.textContent = Math.round(eq.runHours).toLocaleString("ro-RO") + " h";
    for (const r of panel.rows) {
      const ps = E.paramState(eq, r.p);
      r.v.textContent = E.fmt(eq.values[r.p.key]);
      r.v.className = "h-prm-v mono lv-" + ps;
      r.row.className = "h-prm" + (ps === "warn" ? " h-pw" : ps === "crit" ? " h-pc" : "");
    }
  }

  function updateEmpty() {
    const box = side.querySelector(".h-attn"); if (!box) return;
    const list = E.equipment.filter(e => e.status === "maint" || E.eqState(e) !== "ok");
    const sig = list.map(e => e.id + e.status + E.eqState(e)).join(",");
    if (sig === attnSig) return; attnSig = sig;
    box.innerHTML = list.length ? list.map(e => {
      const why = e.status === "maint" ? "Mentenanță" : "În afara limitelor";
      return `<button class="h-att" data-act="pick" data-id="${e.id}"><i class="dot ${e.status}"></i><span>${esc(e.name)}</span><small>${esc(why)}</small></button>`;
    }).join("") : `<div class="h-ok">✔ Toate utilajele funcționează în parametri.</div>`;
  }

  function renderPanel() {
    const eq = sel && E.byId[sel];
    const sig = eq ? eq.id + "|" + eq.status : "none";
    if (sig !== panelSig) {
      panelSig = sig; attnSig = "";
      side.innerHTML = eq ? panelHTML(eq) : emptyHTML();
      bindPanel(eq);
    }
    if (eq) updatePanel(eq); else updateEmpty();
  }

  // ---------- evenimente
  function onPanelClick(e) {
    const dep = e.target.closest(".dep-btn");
    if (dep) {
      const name = dep.dataset.dep;
      U.show("cereri");
      if (U.views.cereri && U.views.cereri.pick) U.views.cereri.pick(name);
      return;
    }
    const b = e.target.closest('[data-act="pick"]');
    if (b) E.select(b.dataset.id);
  }

  function pickFromMap(g) {
    if (!g) return;
    E.select(g.dataset.id);
    if (window.matchMedia && window.matchMedia("(max-width: 1100px)").matches) side.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- filtru pe departament: ce utilaje sunt relevante pentru cine
  const PROD_ZONES = ["Z1", "Z2", "Z3", "Z4", "Z5", "Z6"];
  const inIds = list => eq => list.includes(eq.id);
  const DEPTS = [
    ["toti", "Toți", null, ""],
    ["dg", "Director General", () => true, "vedere de ansamblu asupra întregii fabrici"],
    ["prod", "Producție", eq => PROD_ZONES.includes(eq.zone), "toate utilajele de producție (recepție → expediție)"],
    ["cal", "Calitate", inIds(["AF01", "AF02", "CF01", "DEP01", "MAT01", "MAT02", "TR01", "DM01", "LAB01"]), "temperaturi CCP, detector metale, laborator"],
    ["ach", "Achiziții", eq => eq.status === "fault" || eq.nextMaint - Date.now() <= 14 * 864e5, "utilaje care cer piese (mentenanță în următoarele 14 zile)"],
    ["log", "Logistică", inIds(["DEP01", "RMP01", "FRG01"]), "depozit frigorific, rampă, frig"],
    ["vz", "Vânzări", inIds(["UMP01", "AF01", "AF02", "TR01"]), "pașii care limitează capacitatea"],
    ["mkt", "Marketing", inIds(["UMP01", "FEL01", "AMB01", "AF01", "AF02", "MAT01", "MAT02"]), "linii pentru produse noi / ambalaje"],
    ["it", "IT", () => true, "comunicație SCADA – toate punctele de măsură"],
    ["jur", "Juridic", inIds(["CAZ01", "FRG01", "AER01", "EPU01"]), "echipamente cu autorizații ISCIR / mediu"],
    ["cont", "Contabilitate", inIds(["PT01", "CAZ01", "FRG01", "AER01", "APA01"]), "consumatori de energie și utilități"]
  ];
  const DEPT_KEY = "elit.harta.dept";
  let dept = "toti", deptSel = null, deptBox = null, deptSig = "";
  try { const v = localStorage.getItem(DEPT_KEY); if (v && DEPTS.some(d => d[0] === v)) dept = v; } catch (err) { /* stocare indisponibila */ }
  // 0 = estompat, 1 = relevant, 2 = evidentiat
  function deptRel(eq) {
    const d = DEPTS.find(x => x[0] === dept); if (!d || !d[2]) return 1;
    if (!d[2](eq)) return 0;
    return dept === "it" && (E.alarms || []).some(a => a.active && a.eqId === eq.id) ? 2 : 1;
  }
  function deptHint(n) {
    const d = DEPTS.find(x => x[0] === dept);
    const sig = dept + "|" + n;
    if (!deptBox || sig === deptSig) return; deptSig = sig;
    if (!d || !d[2]) { deptBox.hidden = true; return; }
    deptBox.hidden = false;
    deptBox.innerHTML = `<b>${esc(d[1])}</b>: ${esc(d[3])} <span>· ${n} utilaje relevante</span>`;
  }
  function deptInit() {
    deptSel = root.querySelector("[data-dept]"); deptBox = root.querySelector(".h-dhint");
    deptSel.value = dept;
    deptSel.addEventListener("change", () => {
      dept = deptSel.value; deptSig = "";
      try { localStorage.setItem(DEPT_KEY, dept); } catch (err) { /* stocare indisponibila */ }
      render();
    });
  }

  // ---------- init / render
  function init(r) {
    root = r;
    const style = document.createElement("style"); style.textContent = CSS; document.head.appendChild(style);
    const leg = [["run", "În funcțiune"], ["stop", "Oprit"], ["maint", "Mentenanță"]];
    root.innerHTML = `
      <div class="h-layout">
        <div style="min-width:0"><div class="h-mapbox"><div class="h-tools">
          <b class="h-ttl">Plan hală</b>
          <label class="h-dept">Arată pentru: <select data-dept>${DEPTS.map(d => `<option value="${d[0]}">${esc(d[1])}</option>`).join("")}</select></label>
          <div class="h-legend">
            ${leg.map(([k, l]) => `<span class="h-lg"><i class="dot ${k}"></i>${l}<b data-c="${k}">0</b></span>`).join("")}
            <span class="h-sep"></span>
            <span class="h-lg"><i class="h-lg-flow" style="border-top-style:solid;border-color:var(--text)"></i>Flux</span>
            <span class="h-lg"><i class="h-lg-flow" style="border-color:var(--muted)"></i>Maturare</span>
          </div>
          <div class="h-zoom"><button type="button" data-zoom="out" title="Micșorează">−</button><span data-z>100%</span><button type="button" data-zoom="in" title="Mărește">+</button><button type="button" data-zoom="fit" title="Potrivește planul în fereastră">Potrivește</button></div>
        </div><div class="h-dhint" hidden></div><div class="h-canvas"></div></div><div class="h-hint">Click pe un utilaj pentru parametri și departamentele care îi folosesc datele · trageți pentru a deplasa planul · rotița mouse-ului sau ciupire pentru zoom</div></div>
        <aside class="panel h-side"></aside>
      </div>`;
    const wrapEl = root.querySelector(".h-canvas");
    side = root.querySelector(".h-side");
    root.querySelectorAll("[data-c]").forEach(n => legend[n.dataset.c] = n);

    const built = buildSVG();
    wrapEl.insertAdjacentHTML("afterbegin", built.s);
    svg = wrapEl.querySelector("svg");
    svg.querySelectorAll(".h-eq").forEach(g => {
      const id = g.dataset.id;
      refs[id] = { g, p: built.vals[id], v: g.querySelector("[data-v]"), txt: "", vcls: "", cls: "" };
    });
    segs = [...svg.querySelectorAll(".h-arw")].map(el => ({ el, srcs: el.dataset.src.split(","), run: null }));

    cvInit(wrapEl);
    deptInit();
    svg.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { const g = e.target.closest && e.target.closest(".h-eq"); if (g) { e.preventDefault(); pickFromMap(g); } }
    });
    side.addEventListener("click", onPanelClick);
    E.on("select", id => { sel = id; render(); });
    render();
  }

  function render() {
    if (!root || !svg) return;
    if (!cvs.fitted) cvFit(true);
    const counts = { run: 0, stop: 0, fault: 0, maint: 0, warn: 0 }; let relN = 0;
    for (const eq of E.equipment) {
      counts[eq.status] = (counts[eq.status] || 0) + 1;
      const r = refs[eq.id]; if (!r) continue;
      const st = E.eqState(eq);
      if (st === "warn") counts.warn++;
      const rel = deptRel(eq);
      const cls = "h-eq s-" + eq.status + (st !== "ok" ? " w-" + st : "") + (eq.id === sel ? " sel" : "") + (rel === 0 ? " dim" : rel === 2 ? " hl" : "");
      if (rel) relN++;
      if (cls !== r.cls) { r.g.setAttribute("class", cls); r.cls = cls; }
      if (r.v && r.p) {
        const txt = E.fmt(eq.values[r.p.key]);
        if (txt !== r.txt) { r.v.textContent = txt; r.txt = txt; }
        const c = "h-v lv-" + E.paramState(eq, r.p);
        if (c !== r.vcls) { r.v.setAttribute("class", c); r.vcls = c; }
      }
    }
    for (const s of segs) {
      const run = s.srcs.some(id => E.byId[id] && E.byId[id].status === "run");
      if (run !== s.run) { s.el.classList.toggle("on", run); s.run = run; }
    }
    for (const k in legend) legend[k].textContent = counts[k] || 0;
    deptHint(relN);
    renderPanel();
  }

  U.views.harta = { init, render };
})();
