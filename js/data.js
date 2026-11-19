// ELIT SCADA - date utilaje (simulare). Coordonate harta: viewBox 0 0 1200 700.
// zone: definesc zonele halei pe harta (dreptunghiuri).
window.ELIT_DATA = {
  site: "ELIT SRL - Fabrica Cugir (simulare)",
  zones: [
    { id: "Z1", name: "Receptie & Refrigerare materie prima", x: 20,  y: 20,  w: 260, h: 300, color: "#3b82f6" },
    { id: "Z2", name: "Procesare (tocare, cutter, malaxare)", x: 300, y: 20,  w: 330, h: 300, color: "#f59e0b" },
    { id: "Z3", name: "Umplere & Tratament termic",           x: 650, y: 20,  w: 280, h: 300, color: "#ef4444" },
    { id: "Z4", name: "Maturare crud-uscate",                 x: 950, y: 20,  w: 230, h: 300, color: "#a855f7" },
    { id: "Z5", name: "Racire, feliere & ambalare",           x: 650, y: 340, w: 280, h: 200, color: "#10b981" },
    { id: "Z6", name: "Depozit frigorific & Expeditie",       x: 950, y: 340, w: 230, h: 340, color: "#06b6d4" },
    { id: "Z7", name: "Utilitati (frig, abur, aer, energie, apa)", x: 20, y: 340, w: 610, h: 340, color: "#64748b" },
    { id: "Z8", name: "Laborator & Birou Tehnic",             x: 650, y: 560, w: 280, h: 120, color: "#94a3b8" }
  ],
  // fluxul produsului pe harta (ordinea utilajelor) - pentru animatia de flux
  flow: ["CF01", "TOC01", "CUT01", "MAL01", "UMP01", "AF01", "AF02", "TR01", "FEL01", "AMB01", "DM01", "DEP01"],
  flowCrud: ["UMP01", "MAT01", "MAT02", "FEL01"],
  equipment: [
    { id: "CF01", name: "Camera frig materie prima", zone: "Z1", type: "camera", x: 40, y: 60, w: 220, h: 110,
      params: [
        { key: "temp", label: "Temperatura", unit: "°C", sp: 2, min: -5, max: 15, lo: 0, hi: 4, noise: 0.15 },
        { key: "umid", label: "Umiditate", unit: "%", sp: 85, min: 50, max: 100, lo: 75, hi: 95, noise: 0.6 }
      ], controls: ["startstop", "setpoint"] },
    { id: "CN01", name: "Cantar receptie", zone: "Z1", type: "cantar", x: 40, y: 200, w: 220, h: 90,
      params: [ { key: "debit", label: "Receptie", unit: "kg/h", sp: 1800, min: 0, max: 3000, lo: 500, hi: 2800, noise: 40 } ],
      controls: ["startstop"] },
    { id: "TOC01", name: "Tocator (Wolf) 160", zone: "Z2", type: "tocator", x: 320, y: 60, w: 140, h: 100,
      params: [
        { key: "turatie", label: "Turatie", unit: "rpm", sp: 220, min: 0, max: 350, lo: 150, hi: 300, noise: 3 },
        { key: "curent", label: "Curent motor", unit: "A", sp: 42, min: 0, max: 80, lo: 0, hi: 65, noise: 1.2 },
        { key: "tempProd", label: "Temp. produs", unit: "°C", sp: 3, min: -5, max: 15, lo: -2, hi: 6, noise: 0.15 }
      ], controls: ["startstop", "setpoint", "speed"] },
    { id: "CUT01", name: "Cutter 500L", zone: "Z2", type: "cutter", x: 475, y: 60, w: 140, h: 100,
      params: [
        { key: "turatie", label: "Turatie cutit", unit: "rpm", sp: 3000, min: 0, max: 4500, lo: 1500, hi: 4000, noise: 25 },
        { key: "tempProd", label: "Temp. pasta", unit: "°C", sp: 10, min: 0, max: 20, lo: 2, hi: 12, noise: 0.2 },
        { key: "vacuum", label: "Vacuum", unit: "%", sp: 90, min: 0, max: 100, lo: 80, hi: 100, noise: 0.5 }
      ], controls: ["startstop", "setpoint", "speed"] },
    { id: "MAL01", name: "Malaxor vacuum", zone: "Z2", type: "malaxor", x: 320, y: 190, w: 295, h: 100,
      params: [
        { key: "turatie", label: "Turatie", unit: "rpm", sp: 40, min: 0, max: 80, lo: 20, hi: 60, noise: 0.8 },
        { key: "vacuum", label: "Vacuum", unit: "%", sp: 85, min: 0, max: 100, lo: 70, hi: 100, noise: 0.6 }
      ], controls: ["startstop", "speed"] },
    { id: "UMP01", name: "Masina umplere & clipsare", zone: "Z3", type: "umplere", x: 670, y: 60, w: 110, h: 230,
      params: [
        { key: "cadenta", label: "Cadenta", unit: "buc/min", sp: 120, min: 0, max: 200, lo: 60, hi: 180, noise: 2 },
        { key: "presiune", label: "Presiune umplere", unit: "bar", sp: 18, min: 0, max: 30, lo: 10, hi: 25, noise: 0.3 }
      ], controls: ["startstop", "setpoint", "speed"] },
    { id: "AF01", name: "Celula afumare-fierbere 1", zone: "Z3", type: "celula", x: 800, y: 60, w: 110, h: 105,
      params: [
        { key: "temp", label: "Temp. celula", unit: "°C", sp: 78, min: 0, max: 120, lo: 70, hi: 85, noise: 0.4 },
        { key: "tempMiez", label: "Temp. miez (CCP)", unit: "°C", sp: 72, min: 0, max: 100, lo: 70, hi: 80, noise: 0.3 },
        { key: "umid", label: "Umiditate", unit: "%", sp: 60, min: 0, max: 100, lo: 40, hi: 80, noise: 0.8 }
      ], controls: ["startstop", "setpoint", "program"] },
    { id: "AF02", name: "Celula afumare-fierbere 2", zone: "Z3", type: "celula", x: 800, y: 185, w: 110, h: 105,
      params: [
        { key: "temp", label: "Temp. celula", unit: "°C", sp: 78, min: 0, max: 120, lo: 70, hi: 85, noise: 0.4 },
        { key: "tempMiez", label: "Temp. miez (CCP)", unit: "°C", sp: 72, min: 0, max: 100, lo: 70, hi: 80, noise: 0.3 },
        { key: "umid", label: "Umiditate", unit: "%", sp: 60, min: 0, max: 100, lo: 40, hi: 80, noise: 0.8 }
      ], controls: ["startstop", "setpoint", "program"] },
    { id: "MAT01", name: "Camera maturare 1 (salam crud-uscat)", zone: "Z4", type: "camera", x: 965, y: 60, w: 200, h: 105,
      params: [
        { key: "temp", label: "Temperatura", unit: "°C", sp: 14, min: 0, max: 30, lo: 12, hi: 18, noise: 0.15 },
        { key: "umid", label: "Umiditate", unit: "%", sp: 80, min: 40, max: 100, lo: 75, hi: 88, noise: 0.5 },
        { key: "aw", label: "Activitate apa (aw)", unit: "", sp: 0.92, min: 0.8, max: 1, lo: 0.85, hi: 0.96, noise: 0.002 }
      ], controls: ["startstop", "setpoint"] },
    { id: "MAT02", name: "Camera maturare 2 (afumaturi)", zone: "Z4", type: "camera", x: 965, y: 185, w: 200, h: 105,
      params: [
        { key: "temp", label: "Temperatura", unit: "°C", sp: 16, min: 0, max: 30, lo: 12, hi: 18, noise: 0.15 },
        { key: "umid", label: "Umiditate", unit: "%", sp: 78, min: 40, max: 100, lo: 72, hi: 86, noise: 0.5 }
      ], controls: ["startstop", "setpoint"] },
    { id: "TR01", name: "Tunel racire rapida", zone: "Z5", type: "tunel", x: 670, y: 370, w: 240, h: 45,
      params: [
        { key: "temp", label: "Temp. aer", unit: "°C", sp: -2, min: -15, max: 15, lo: -6, hi: 2, noise: 0.2 },
        { key: "tempMiez", label: "Temp. miez iesire", unit: "°C", sp: 4, min: -5, max: 20, lo: 0, hi: 7, noise: 0.2 }
      ], controls: ["startstop", "setpoint"] },
    { id: "FEL01", name: "Linie feliere", zone: "Z5", type: "feliere", x: 670, y: 430, w: 110, h: 90,
      params: [
        { key: "cadenta", label: "Cadenta", unit: "felii/min", sp: 600, min: 0, max: 900, lo: 300, hi: 850, noise: 8 }
      ], controls: ["startstop", "speed"] },
    { id: "AMB01", name: "Ambalare MAP / vacuum", zone: "Z5", type: "ambalare", x: 795, y: 430, w: 75, h: 90,
      params: [
        { key: "cadenta", label: "Cadenta", unit: "pach/min", sp: 40, min: 0, max: 70, lo: 20, hi: 60, noise: 0.8 },
        { key: "o2", label: "O2 rezidual", unit: "%", sp: 0.3, min: 0, max: 3, lo: 0, hi: 0.8, noise: 0.03 }
      ], controls: ["startstop", "speed"] },
    { id: "DM01", name: "Detector metale (CCP)", zone: "Z5", type: "detector", x: 880, y: 430, w: 40, h: 90,
      params: [ { key: "rejecturi", label: "Respingeri", unit: "/h", sp: 1, min: 0, max: 20, lo: 0, hi: 5, noise: 0.3 } ],
      controls: ["startstop", "test"] },
    { id: "DEP01", name: "Depozit frigorific produs finit", zone: "Z6", type: "camera", x: 965, y: 370, w: 200, h: 150,
      params: [
        { key: "temp", label: "Temperatura", unit: "°C", sp: 2, min: -5, max: 15, lo: 0, hi: 4, noise: 0.12 },
        { key: "ocupare", label: "Grad ocupare", unit: "%", sp: 72, min: 0, max: 100, lo: 0, hi: 92, noise: 0.3 }
      ], controls: ["startstop", "setpoint"] },
    { id: "RMP01", name: "Rampa expeditie (3 usi)", zone: "Z6", type: "rampa", x: 965, y: 540, w: 200, h: 120,
      params: [ { key: "temp", label: "Temp. rampa", unit: "°C", sp: 6, min: 0, max: 20, lo: 0, hi: 10, noise: 0.3 } ],
      controls: ["startstop"] },
    { id: "FRG01", name: "Statie frig (compresoare NH3)", zone: "Z7", type: "compresor", x: 40, y: 380, w: 180, h: 120,
      params: [
        { key: "pAsp", label: "Presiune aspiratie", unit: "bar", sp: 2.1, min: 0, max: 6, lo: 1.5, hi: 3, noise: 0.03 },
        { key: "pRef", label: "Presiune refulare", unit: "bar", sp: 12, min: 0, max: 20, lo: 8, hi: 15, noise: 0.12 },
        { key: "nh3", label: "Detector NH3", unit: "ppm", sp: 2, min: 0, max: 100, lo: 0, hi: 25, noise: 0.4 }
      ], controls: ["startstop", "setpoint"] },
    { id: "CAZ01", name: "Centrala abur", zone: "Z7", type: "cazan", x: 240, y: 380, w: 170, h: 120,
      params: [
        { key: "presiune", label: "Presiune abur", unit: "bar", sp: 8, min: 0, max: 14, lo: 6, hi: 10, noise: 0.08 },
        { key: "temp", label: "Temp. abur", unit: "°C", sp: 175, min: 0, max: 220, lo: 160, hi: 190, noise: 0.6 }
      ], controls: ["startstop", "setpoint"] },
    { id: "AER01", name: "Compresor aer comprimat", zone: "Z7", type: "compresor", x: 430, y: 380, w: 180, h: 120,
      params: [ { key: "presiune", label: "Presiune retea", unit: "bar", sp: 7, min: 0, max: 10, lo: 6, hi: 8.5, noise: 0.05 } ],
      controls: ["startstop", "setpoint"] },
    { id: "PT01", name: "Post trafo & tablou general", zone: "Z7", type: "electric", x: 40, y: 530, w: 180, h: 130,
      params: [
        { key: "putere", label: "Putere activa", unit: "kW", sp: 1450, min: 0, max: 2500, lo: 200, hi: 2200, noise: 25 },
        { key: "cosfi", label: "Factor putere", unit: "", sp: 0.95, min: 0.5, max: 1, lo: 0.9, hi: 1, noise: 0.004 }
      ], controls: ["startstop"] },
    { id: "APA01", name: "Statie tratare apa", zone: "Z7", type: "apa", x: 240, y: 530, w: 170, h: 130,
      params: [
        { key: "debit", label: "Debit", unit: "m3/h", sp: 22, min: 0, max: 40, lo: 8, hi: 35, noise: 0.4 },
        { key: "clor", label: "Clor liber", unit: "mg/L", sp: 0.4, min: 0, max: 1.5, lo: 0.2, hi: 0.6, noise: 0.01 }
      ], controls: ["startstop", "setpoint"] },
    { id: "EPU01", name: "Statie epurare ape uzate", zone: "Z7", type: "apa", x: 430, y: 530, w: 180, h: 130,
      params: [
        { key: "ph", label: "pH evacuare", unit: "", sp: 7.2, min: 0, max: 14, lo: 6.5, hi: 8.5, noise: 0.03 },
        { key: "debit", label: "Debit", unit: "m3/h", sp: 18, min: 0, max: 40, lo: 0, hi: 32, noise: 0.4 }
      ], controls: ["startstop"] },
    { id: "LAB01", name: "Laborator control calitate", zone: "Z8", type: "laborator", x: 670, y: 590, w: 120, h: 75,
      params: [ { key: "probe", label: "Probe in lucru", unit: "buc", sp: 12, min: 0, max: 40, lo: 0, hi: 30, noise: 0.3 } ],
      controls: [] }
  ],
  // Livrabile ale departamentului Tehnic (din Document Mapare Legaturi - ELIT)
  livrabileTEH: [
    { cod: "TEH 001", post: "Sef Serviciu Tehnic / Mentenanta", livrabil: "Plan mentenanta preventiva utilaje si frig", format: "Fisier Word/Excel/PDF", rezolutie: "Aprobare", periodicitate: "Lunar", timing: "4/5/12.00", reactie: "36 ore" },
    { cod: "TEH 002", post: "Inginer Energetic / Frig Industrial", livrabil: "Raport opriri neplanificate si consumuri energie", format: "Fisier Word/Excel/PDF", rezolutie: "Raportare", periodicitate: "Saptamanal", timing: "Luni/12.00", reactie: "24 ore" },
    { cod: "TEH 003", post: "Sef Serviciu Tehnic / Mentenanta", livrabil: "Raport disponibilitate utilaje si KPI tehnici (OEE, MTBF, MTTR)", format: "Platforma SCADA / Excel", rezolutie: "Raportare", periodicitate: "Lunar", timing: "1/5/12.00", reactie: "24 ore" }
  ],
  // Departamentele din simulare (lista reala a cursului) si legaturile cu Departamentul Tehnic.
  // catreTEH = ce primim de la ei ; dinTEH = ce le oferim noi (tag = eticheta pe sageata, ecran = unde arata in SCADA)
  departamente: ["Director General", "Producție", "Calitate", "Achiziții", "Logistică", "Vânzări", "Marketing", "IT", "Juridic", "Contabilitate"],
  fluxuri: {
    catreTEH: [
      { dep: "Director General", cod: "CG 002", info: "Obiective anuale și buget aprobat pentru mentenanță și investiții" },
      { dep: "Producție", cod: "PRD 001", info: "Plan de producție pe linii (ca să programăm opririle)" },
      { dep: "Producție", cod: "PRD 003", info: "Fișa de tură: opriri linie, defecte semnalate de operatori" },
      { dep: "Calitate", cod: "CAL 001", info: "Cerințe HACCP pentru utilaje: CCP-uri, calibrări, igienizare" },
      { dep: "Achiziții", cod: "ACH 002", info: "Comenzi piese de schimb și termene de livrare de la furnizori" },
      { dep: "Logistică", cod: "LOG 002", info: "Grad de ocupare depozit frigorific și program de încărcare la rampă" },
      { dep: "Vânzări", cod: "VNZ 002", info: "Comenzi mari / urgente care cer capacitate suplimentară" },
      { dep: "Marketing", cod: "MKT 002", info: "Brief produs nou: ce utilaje și ce rețetă de proces sunt necesare" },
      { dep: "IT", cod: "IT 001", info: "Disponibilitate rețea și servere pentru SCADA" },
      { dep: "Juridic", cod: "JUR 001", info: "Contracte de service cu furnizorii de utilaje, avizate" },
      { dep: "Contabilitate", cod: "CTB 003", info: "Facturi service și piese, scadențe furnizori" }
    ],
    dinTEH: [
      { dep: "Director General", tag: "TEH 003", info: "KPI tehnici: disponibilitate, OEE, MTBF, MTTR (lunar + live)", ecran: "mentenanta", format: "Raport TEH 003 / SCADA live", termen: "Lunar, ziua 5" },
      { dep: "Producție", tag: "live", info: "Starea utilajelor în timp real și disponibilitatea liniilor", ecran: "harta", format: "SCADA live", termen: "Permanent" },
      { dep: "Producție", tag: "Capacitate", info: "Ritmul liniei (kg/h), gâtuirea și cât mai putem produce în tura curentă", ecran: "capacitate", format: "SCADA live", termen: "Imediat" },
      { dep: "Producție", tag: "TEH 001", info: "Plan de opriri pentru mentenanță preventivă", ecran: "mentenanta", format: "Raport TEH 001", termen: "Lunar, săpt. 4" },
      { dep: "Calitate", tag: "CCP", info: "Temperaturi CCP (miez celule, camere frig), teste detector metale, calibrări", ecran: "control", format: "Export CSV din SCADA", termen: "Zilnic / la audit" },
      { dep: "Achiziții", tag: "Piese", info: "Necesar piese de schimb și consumabile, specificații tehnice", ecran: "mentenanta", format: "Listă necesar (Excel)", termen: "Săptămânal" },
      { dep: "Logistică", tag: "Temp.", info: "Temperatura live în depozitul frigorific și la rampă, starea ușilor", ecran: "harta", format: "SCADA live + alarme", termen: "Permanent" },
      { dep: "Vânzări", tag: "Capacitate", info: "Cât producem pe tură / zi / săptămână la capacitatea actuală (cantitate produsă, capacitate disponibilă)", ecran: "capacitate", format: "Răspuns din SCADA (copiat)", termen: "Imediat" },
      { dep: "Vânzări", tag: "TEH 001", info: "Opriri planificate care afectează livrările", ecran: "mentenanta", format: "E-mail + plan TEH 001", termen: "La cerere, 24 ore" },
      { dep: "Director General", tag: "Producție", info: "Cât am produs azi și proiecția pe săptămână, unde e gâtuirea liniei", ecran: "capacitate", format: "Răspuns din SCADA (copiat)", termen: "Imediat" },
      { dep: "Logistică", tag: "Volum", info: "Cantitatea de produs finit care iese pe tură (pentru planificarea transportului)", ecran: "capacitate", format: "Răspuns din SCADA (copiat)", termen: "Imediat" },
      { dep: "Marketing", tag: "Fezabilitate", info: "Fezabilitate tehnică pentru produse noi (linii, capacitate, utilaje)", ecran: "control", format: "Aviz tehnic (Word)", termen: "La cerere, 72 ore" },
      { dep: "IT", tag: "Incidente", info: "Incidente de comunicație cu utilajele și cerințe hardware SCADA", ecran: "alarme", format: "Jurnal evenimente (CSV)", termen: "La incident, 3 ore" },
      { dep: "Juridic", tag: "Autorizații", info: "Documentație tehnică pentru contracte și autorizații (ISCIR, mediu)", ecran: "flux", format: "Dosar tehnic (PDF)", termen: "La cerere, 72 ore" },
      { dep: "Contabilitate", tag: "TEH 002", info: "Consum de energie și costuri de mentenanță pe centre de cost", ecran: "mentenanta", format: "Raport TEH 002", termen: "Săptămânal, luni" }
    ]
  }
};
