// ELIT SCADA - nucleu de simulare (fara dependinte, merge si din file://)
// API public: window.ELIT  (vezi CONTRACT.md)
(function () {
  const D = window.ELIT_DATA;
  const listeners = {};
  // FARA SIMULARE: valorile stau fixe, iar datele "aleatoare" (ore functionare, scadente, MTBF...) sunt aceleasi la fiecare deschidere
  const STATIC = true;
  let seed = 20261119;
  const srand = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rnd = (a, b) => a + srand() * (b - a);
  const gauss = () => STATIC ? 0 : (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

  // ---- stare utilaje
  const equipment = D.equipment.map((e, i) => ({
    ...e,
    status: "run",            // run | stop | fault | maint
    speed: 100,               // % (pentru utilaje cu "speed")
    program: e.type === "celula" ? "Fierbere" : null,
    values: Object.fromEntries(e.params.map(p => [p.key, p.sp])),
    history: Object.fromEntries(e.params.map(p => [p.key, []])), // ultimele 120 valori
    runHours: Math.round(rnd(800, 9000)),
    lastMaint: Date.now() - rnd(5, 40) * 864e5,
    nextMaint: Date.now() + rnd(1, 30) * 864e5,
    mtbf: Math.round(rnd(180, 900)),  // ore
    mttr: +rnd(0.5, 4).toFixed(1),     // ore
    stops: Math.floor(rnd(0, 6)),      // opriri neplanificate luna curenta
    oee: { a: rnd(0.88, 0.98), p: rnd(0.85, 0.97), q: rnd(0.96, 0.995) },
    alarmFlags: {}
  }));
  equipment.find(e => e.id === "MAL01").status = "maint"; // un utilaj in mentenanta la start
  const byId = Object.fromEntries(equipment.map(e => [e.id, e]));

  const alarms = [];   // {id, eqId, param, level:'warn'|'crit', msg, time, ack:false, active:true}
  const events = [];   // {time, user, eqId, msg, type:'cmd'|'alarm'|'system'}
  let alarmSeq = 1;
  let user = "Operator TEH";

  function emit(ev, payload) { (listeners[ev] || []).forEach(fn => { try { fn(payload); } catch (err) { console.error(err); } }); }
  function on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); }

  function log(eqId, msg, type = "cmd") {
    const e = { time: Date.now(), user, eqId, msg, type };
    events.unshift(e); if (events.length > 500) events.pop();
    emit("event", e);
  }

  function raise(eq, p, level, msg) {
    const key = p ? p.key : "_status";
    if (eq.alarmFlags[key] === level) return;
    clearAlarm(eq, key, true);
    eq.alarmFlags[key] = level;
    const a = { id: alarmSeq++, eqId: eq.id, param: key, level, msg, time: Date.now(), ack: false, active: true };
    alarms.unshift(a); if (alarms.length > 300) alarms.pop();
    log(eq.id, (level === "crit" ? "ALARMĂ: " : "Avertizare: ") + msg, "alarm");
    emit("alarm", a);
  }
  function clearAlarm(eq, key, silent) {
    if (!eq.alarmFlags[key]) return;
    delete eq.alarmFlags[key];
    alarms.filter(a => a.eqId === eq.id && a.param === key && a.active).forEach(a => { a.active = false; a.cleared = Date.now(); });
    if (!silent) log(eq.id, "Revenire la normal: " + key, "alarm");
  }

  // ---- simulare
  function step() {
    for (const eq of equipment) {
      const running = eq.status === "run";
      for (const p of eq.params) {
        let v = eq.values[p.key];
        let target = p.sp;
        if (!running) {
          // utilaj oprit: miscari spre "repaus"
          if (/turatie|cadenta|debit|curent|presiune|putere|vacuum|rejecturi/.test(p.key)) target = 0;
          else if (/temp/.test(p.key)) target = (p.key === "temp" && eq.type === "celula") ? 25 : p.sp + (eq.type === "camera" ? 3 : 0);
        } else if (eq.speed !== 100 && /turatie|cadenta|debit|curent/.test(p.key)) {
          target = p.sp * eq.speed / 100;
        }
        if (eq._drift && eq._drift.key === p.key) target += eq._drift.delta;
        const inertia = /temp|umid|aw/.test(p.key) ? 0.06 : 0.25;
        v = v + (target - v) * inertia + gauss() * p.noise * (running ? 1 : 0.3);
        v = Math.max(p.min, Math.min(p.max, v));
        eq.values[p.key] = v;
        const h = eq.history[p.key]; h.push(v); if (h.length > 120) h.shift();
        // alarme pe praguri (doar cand ruleaza sau pentru camere frig)
        const check = running || eq.type === "camera";
        if (check && (v > p.hi || v < p.lo)) {
          const far = v > p.hi + (p.hi - p.lo) * 0.25 || v < p.lo - (p.hi - p.lo) * 0.25;
          raise(eq, p, far ? "crit" : "warn", `${eq.name}: ${p.label} = ${fmt(v)} ${p.unit} (limite ${p.lo}…${p.hi})`);
        } else if (eq.alarmFlags[p.key]) clearAlarm(eq, p.key);
      }
      if (running) {
        if (!STATIC) eq.runHours += 1 / 60; // 1 tick = 1 minut simulat
        if (!STATIC) eq.oee.a = Math.min(0.995, eq.oee.a + 0.0002); if (!STATIC) eq.oee.p = clamp(eq.oee.p + gauss() * 0.002, 0.75, 0.99);
      } else if (eq.status === "fault") {
        eq.oee.a = Math.max(0.5, eq.oee.a - 0.002);
      }
      if (eq._drift && Date.now() > eq._drift.until) delete eq._drift;
    }
    // evenimente aleatoare: deriva parametru sau defect
    if (!STATIC && Math.random() < 0.025) {
      const cand = equipment.filter(e => e.status === "run" && e.params.length);
      const eq = cand[Math.floor(Math.random() * cand.length)];
      const p = eq.params[Math.floor(Math.random() * eq.params.length)];
      eq._drift = { key: p.key, delta: (p.hi - p.lo) * rnd(0.6, 1.2) * (Math.random() < 0.5 ? -1 : 1), until: Date.now() + rnd(15, 40) * 1000 };
    }
    if (!STATIC && Math.random() < 0.006) {
      const cand = equipment.filter(e => e.status === "run" && e.controls.includes("startstop"));
      const eq = cand[Math.floor(Math.random() * cand.length)];
      if (eq) fault(eq, pick(FAULTS[eq.type] || FAULTS._));
    }
    emit("tick", api);
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  // defecte realiste pe tip de utilaj
  const FAULTS = {
    camera: ["Vaporizator înghețat - degivrare eșuată", "Ventilator vaporizator oprit", "Ușa camerei rămasă deschisă", "Senzor temperatură defect"],
    celula: ["Generator fum blocat", "Senzor temperatură miez defect", "Presiune abur insuficientă", "Ușa celulei neînchisă"],
    tunel: ["Ventilator tunel oprit", "Banda transportoare blocată"],
    tocator: ["Suprasarcină motor", "Cuțit / sită uzată - vibrații", "Protecție termică declanșată"],
    cutter: ["Suprasarcină motor", "Capac deschis - interblocare", "Vacuum insuficient"],
    malaxor: ["Suprasarcină motor", "Vacuum insuficient"],
    umplere: ["Presiune umplere instabilă", "Clipsator blocat", "Lipsă membrană"],
    feliere: ["Lama tocită - vibrații", "Banda blocată", "Protecție ușă deschisă"],
    ambalare: ["Folie ruptă", "Lipsă gaz MAP", "Rezistență sudură defectă"],
    detector: ["Test etalon esuat", "Banda respingere blocată"],
    compresor: ["Presiune ulei scăzută", "Temperatura refulare mare", "Protecție termică motor"],
    cazan: ["Nivel apă scăzut", "Flacăra stinsă", "Presiune abur maximă"],
    electric: ["Declanșare întrerupător general", "Supratensiune rețea"],
    apa: ["Pompa dozare oprită", "Filtru colmatat"],
    cantar: ["Celula cântărire decalibrată"],
    rampa: ["Ușa secțională blocată", "Burduf etanșare deteriorat"],
    _: ["Senzor defect", "Protecție termică declanșată"]
  };
  function fault(eq, reason) {
    eq.status = "fault"; eq.faultReason = reason; eq.stops++;
    raise(eq, null, "crit", `${eq.name}: DEFECT - ${reason}`);
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function fmt(v) { const a = Math.abs(v); return a >= 100 ? v.toFixed(0) : a >= 10 ? v.toFixed(1) : v.toFixed(2); }

  // ---- comenzi (ce poate face departamentul tehnic)
  function command(id, cmd, value) {
    const eq = byId[id]; if (!eq) return { ok: false, msg: "Utilaj inexistent" };
    switch (cmd) {
      case "start":
        if (eq.status === "fault") return { ok: false, msg: "Utilaj în defect - faceți RESET întâi" };
        if (eq.status === "maint") return { ok: false, msg: "Utilaj în mentenanță - încheiați lucrarea întâi" };
        eq.status = "run"; log(id, `Pornire ${eq.name}`); break;
      case "stop": eq.status = "stop"; log(id, `Oprire ${eq.name}`); break;
      case "reset":
        if (eq.status !== "fault") return { ok: false, msg: "Nu există defect activ" };
        eq.status = "stop"; delete eq.faultReason; clearAlarm(eq, "_status"); log(id, `Reset defect ${eq.name}`); break;
      case "maint":
        eq.status = "maint"; log(id, `Trecere in MENTENANȚĂ: ${eq.name}${value ? " - " + value : ""}`); break;
      case "maintDone":
        eq.status = "stop"; eq.lastMaint = Date.now(); eq.nextMaint = Date.now() + 30 * 864e5;
        clearAlarm(eq, "_status"); log(id, `Mentenanță finalizată: ${eq.name}`); break;
      case "setpoint": {
        const p = eq.params.find(p => p.key === value.key); if (!p) return { ok: false, msg: "Parametru inexistent" };
        const old = p.sp; p.sp = clamp(+value.value, p.min, p.max);
        log(id, `Setpoint ${p.label}: ${fmt(old)} → ${fmt(p.sp)} ${p.unit}`); break;
      }
      case "speed": eq.speed = clamp(+value, 0, 120); log(id, `Viteza ${eq.name}: ${eq.speed}%`); break;
      case "program": eq.program = value; log(id, `Program ${eq.name}: ${value}`); break;
      case "test": log(id, `Test detector cu etalon Fe 2.0 / NFe 2.5 / Inox 3.0 mm - OK`); break;
      case "estop":
        equipment.forEach(e => { if (e.status === "run" && e.zone === eq.zone) e.status = "stop"; });
        log(id, `OPRIRE DE URGENȚĂ zona ${eq.zone}`, "system"); break;
      default: return { ok: false, msg: "Comanda necunoscută" };
    }
    emit("change", eq);
    return { ok: true };
  }
  function ackAlarm(alarmId) {
    const a = alarms.find(a => a.id === alarmId); if (!a || a.ack) return;
    a.ack = true; a.ackBy = user; a.ackTime = Date.now(); log(a.eqId, `Alarma #${a.id} confirmată`, "alarm"); emit("change", null);
  }
  function ackAll() { alarms.filter(a => !a.ack).forEach(a => ackAlarm(a.id)); }
  function simulateFault(id, reason) { const eq = byId[id]; if (eq) { fault(eq, reason || "Defect simulat (demo)"); emit("change", eq); } }

  // ---- KPI agregati
  function kpi() {
    const n = equipment.length;
    const run = equipment.filter(e => e.status === "run").length;
    const fault = equipment.filter(e => e.status === "fault").length;
    const maint = equipment.filter(e => e.status === "maint").length;
    const prod = equipment.filter(e => !["Z7", "Z8"].includes(e.zone));
    const oee = prod.reduce((s, e) => s + e.oee.a * e.oee.p * e.oee.q, 0) / prod.length;
    const power = byId.PT01.values.putere;
    return {
      total: n, run, stop: n - run - fault - maint, fault, maint,
      availability: run / n, oee, power,
      activeAlarms: alarms.filter(a => a.active).length,
      unackAlarms: alarms.filter(a => !a.ack).length,
      critAlarms: alarms.filter(a => a.active && a.level === "crit").length
    };
  }

  // ---- capacitate & productie (kg/h). Pasii liniei; utilajele dintr-un pas lucreaza in paralel (capacitatile se aduna).
  const STEPS = [
    { name: "Procesare", eq: { TOC01: 1000, CUT01: 1200, MAL01: 800 } },
    { name: "Umplere", eq: { UMP01: 2000 } },
    { name: "Tratament termic", eq: { AF01: 1100, AF02: 1100 } },
    { name: "Racire", eq: { TR01: 2400 } }
  ];
  const SHIFT_START = 6; // tura 1 incepe la 06:00
  function eqRate(id, nom) {
    const e = byId[id]; if (e.status !== "run") return 0;
    const sp = e.controls.includes("speed") ? e.speed / 100 : 1;
    return nom * sp * e.oee.p;
  }
  function capacity() {
    const steps = STEPS.map(s => {
      const ids = Object.keys(s.eq);
      return {
        name: s.name, ids,
        nominal: ids.reduce((a, id) => a + s.eq[id], 0),
        actual: ids.reduce((a, id) => a + eqRate(id, s.eq[id]), 0)
      };
    });
    const bott = steps.reduce((m, s) => s.actual < m.actual ? s : m, steps[0]);
    const nominal = Math.min(...steps.map(s => s.nominal));
    const q = STEPS.flatMap(s => Object.keys(s.eq)).reduce((a, id) => a + byId[id].oee.q, 0) / STEPS.flatMap(s => Object.keys(s.eq)).length;
    return { steps, bottleneck: bott, rate: bott.actual * q, nominal, quality: q, producedToday: prod.today, shiftStart: SHIFT_START };
  }
  const prod = { today: 0, last: Date.now() };
  (function initToday() {
    const now = new Date(), h = now.getHours() + now.getMinutes() / 60 - SHIFT_START;
    prod.today = Math.max(0, h) * 1850 * 0.86; // estimare pentru orele scurse din zi
  })();
  on("tick", () => {
    const now = Date.now(), dt = (now - prod.last) / 3600e3; prod.last = now;
    if (dt > 0 && dt < 0.01) prod.today += capacity().rate * dt;
  });

  const api = {
    data: D, equipment, byId, alarms, events,
    on, emit, command, ackAlarm, ackAll, simulateFault, kpi, fmt, log, capacity,
    get user() { return user; }, set user(u) { user = u; },
    selected: null,
    select(id) { api.selected = id; emit("select", id); },
    paramState(eq, p) { const v = eq.values[p.key]; const w = (p.hi - p.lo) * 0.25; return (v > p.hi + w || v < p.lo - w) ? "crit" : (v > p.hi || v < p.lo) ? "warn" : "ok"; },
    eqState(eq) { if (eq.status === "fault") return "crit"; const s = Object.values(eq.alarmFlags); return s.includes("crit") ? "crit" : s.includes("warn") ? "warn" : "ok"; }
  };
  window.ELIT = api;
  // pre-umplere istoric
  for (let i = 0; i < 60; i++) step();
  alarms.length = 0; events.length = 0;
  equipment.forEach(e => { e.alarmFlags = {}; delete e._drift; if (e.status === "fault") { e.status = "run"; delete e.faultReason; } });
  log(null, `SCADA pornit - conectare la ${equipment.length} utilaje (simulare)`, "system");
  setInterval(step, 1000);
})();
