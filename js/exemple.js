// ELIT SCADA - exemple de conținut pentru cele 26 de livrabile ale Departamentului Tehnic (TEH 001-026).
// Fiecare funcție întoarce { rezumat, campuri?: [[câmp, valoare]], tabel?: { cap, randuri }, nota? }.
// Unde se potrivește folosește datele ELIT (utilaje, KPI, capacitate); altfel date de exemplu fixe (nov.-dec. 2026).
(function () {
  const E = () => window.ELIT;
  const nf = (v, d = 0) => Number(v).toLocaleString("ro-RO", { minimumFractionDigits: d, maximumFractionDigits: d });
  const pc = v => nf(v * 100, 1) + "%";
  const eq = id => { try { return E().byId[id]; } catch (e) { return null; } };
  const nm = id => { const e = eq(id); return e ? `${id} ${e.name}` : id; };
  const safe = (f, dflt) => { try { return f(); } catch (e) { return dflt; } };
  const avg = (a, f) => a.reduce((s, x) => s + f(x), 0) / (a.length || 1);
  const prodEq = () => safe(() => E().equipment.filter(e => !["Z7", "Z8"].includes(e.zone)), []);
  const dt = t => new Date(t).toLocaleDateString("ro-RO");
  const RACIRE = s => s.replace("Racire", "Răcire");

  window.ELIT_EXEMPLE = {
    "TEH 001": () => {
      const k = safe(() => E().kpi(), { oee: 0.82, availability: 0.94 });
      const pe = prodEq();
      const top = pe.slice().sort((a, b) => b.stops - a.stops).slice(0, 5);
      return {
        rezumat: "Cum a funcționat parcul de utilaje luna trecută și cât ne-a costat mentenanța?",
        campuri: [["Perioada", "Noiembrie 2026"], ["OEE producție", pc(k.oee)], ["Disponibilitate utilaje", pc(k.availability)],
          ["MTBF mediu", nf(avg(pe, e => e.mtbf) || 540) + " h"], ["MTTR mediu", nf(avg(pe, e => e.mttr) || 1.8, 1) + " h"],
          ["Cost mentenanță", "186.400 lei (buget 195.000 lei, 95,6%)"], ["Ordine de lucru închise", "142 din 151 (94%)"]],
        tabel: { cap: ["Utilaj", "Opriri neplanificate", "MTTR (h)"],
          randuri: top.length ? top.map(e => [nm(e.id), String(e.stops), nf(e.mttr, 1)]) : [["UMP01 Mașină umplere", "4", "1,6"]] },
        nota: "Sursa: SCADA + CMMS (ordine de lucru). Top 5 opriri pe luna curentă."
      };
    },
    "TEH 002": () => ({
      rezumat: "Ce investiții tehnice propunem pentru 2027, cu ce cost și ce câștig adus?",
      campuri: [["An buget", "2027"], ["Total propus", "4.850.000 lei"], ["Termen depunere", "15.12.2026"]],
      tabel: { cap: ["Proiect", "Cost (lei)", "Beneficiu", "Recuperare"],
        randuri: [["A 3-a celulă afumare-fierbere", "1.900.000", "+1.100 kg/h la tratament termic", "3,1 ani"],
          ["Recuperare căldură stație frig NH3", "720.000", "-18% gaz la apă caldă", "2,4 ani"],
          ["Mașină ambalare MAP nouă (termoformare)", "1.450.000", "+30% cadență ambalare", "3,8 ani"],
          ["Panouri fotovoltaice 400 kWp", "780.000", "~480 MWh/an produși", "4,2 ani"]] },
      nota: "Analiza tehnică include oferte de la 3 furnizori OEM per proiect."
    }),
    "TEH 003": () => {
      const pl = safe(() => E().equipment.slice().sort((a, b) => a.nextMaint - b.nextMaint).slice(0, 6), []);
      const ech = ["Echipa mecanică A", "Echipa electrică", "Echipa mecanică B", "Frigotehnist", "Automatist", "Echipa mecanică A"];
      return {
        rezumat: "Când oprim fiecare utilaj pentru mentenanță preventivă în săptămâna următoare și cine intervine?",
        campuri: [["Săptămâna", "S48 (23–29.11.2026)"], ["Agreat cu", "Director Fabrică Cugir"], ["Total ore oprire planificată", "19 h"]],
        tabel: { cap: ["Utilaj", "Dată", "Durată oprire", "Echipă"],
          randuri: pl.map((e, i) => [nm(e.id), dt(e.nextMaint), [2, 4, 3, 1.5, 2, 6][i] + " h", ech[i]]) },
        nota: "Opririle sunt plasate în ferestrele din planul de utilizare a liniilor (PRD-T 001)."
      };
    },
    "TEH 004": () => ({
      rezumat: "Utilajul oprit a fost reparat și poate reporni producția?",
      campuri: [["Utilaj", nm("UMP01")], ["Ora oprire", "19.11.2026 09:42"], ["Ora repornire", "19.11.2026 11:05"],
        ["Durată oprire", "1 h 23 min"], ["Cauză", "Garnitură piston umplere uzată – pierdere presiune"],
        ["Piese înlocuite", "Garnitură piston P/N 4410-218 (1 buc), inel O 32×3 (2 buc)"],
        ["Test funcțional", "OK – presiune 18 bar, cadență 120 buc/min"], ["Semnătură", "Tehnician mentenanță I. Popa / Șef linie M. Dobre"]],
      nota: "Confirmare transmisă în platforma de ordine de lucru; răspuns la sesizarea PRD-T 002."
    }),
    "TEH 005": () => ({
      rezumat: "Ce revizii facem luna aceasta la liniile de sacrificare și la tunelul de frig rapid?",
      campuri: [["Luna", "Decembrie 2026"], ["Locație", "Abator Cugir"]],
      tabel: { cap: ["Utilaj", "Dată", "Operație", "Oprire"],
        randuri: [["Linie sacrificare porc – conveior aerian", "02.12.2026", "Ungere, verificare lanț", "4 h"],
          ["Ferăstrău despicare carcase", "05.12.2026", "Schimb lamă, aliniere", "1 h"],
          ["Opăritor", "09.12.2026", "Detartrare, verificare termostat", "6 h"],
          ["Tunel frig rapid carcase", "13.12.2026", "Curățare evaporatoare, control agent", "8 h"]] }
    }),
    "TEH 006": () => ({
      rezumat: "Funcționează în parametri stația de epurare și utilitățile (apă, abur, aer)?",
      campuri: [["Săptămâna", "S47 (16–22.11.2026)"], ["pH evacuare mediu", nf(safe(() => eq("EPU01").values.ph, 7.2), 2) + " (limită 6,5–8,5)"],
        ["Volum ape uzate", "2.840 m³"], ["Depășiri CCZ/CBO5", "0"], ["Abur produs", "61 t"], ["Aer comprimat", "presiune medie 7,0 bar"]],
      nota: "Buletin laborator autorizat pentru probele de apă uzată: 18.11.2026."
    }),
    "TEH 007": () => ({
      rezumat: "Utilajul pe care s-a intervenit este curat și poate fi folosit pentru alimente?",
      campuri: [["Utilaj", nm("CUT01")], ["Intervenție", "Schimb cuțite cutter, 19.11.2026 13:10–14:00"], ["Lubrifiant folosit", "H1 food grade"]],
      tabel: { cap: ["Pas igienizare", "Ora", "Executat"],
        randuri: [["Îndepărtare scule, șpan, piese vechi", "14:00", "Tehnician"], ["Spălare cu apă caldă 50 °C", "14:05", "Igienizare"],
          ["Spumare detergent alcalin", "14:12", "Igienizare"], ["Clătire + dezinfectare", "14:25", "Igienizare"],
          ["Inspecție vizuală + test ATP (OK)", "14:40", "Calitate"], ["Eliberat pentru producție", "14:45", "Resp. HACCP A. Stan"]] },
      nota: "Declarația de curățenie se semnează de Tehnic și de Calitate (CAL-T 002)."
    }),
    "TEH 008": () => ({
      rezumat: "Instrumentele de măsură de pe punctele critice (CCP) sunt etalonate și valabile?",
      tabel: { cap: ["Instrument", "CCP / loc", "Etalonat", "Valabil până"],
        randuri: [["Sondă temp. miez AF01", "CCP tratament termic ≥ 70 °C", "12.03.2026", "12.03.2027"],
          ["Sondă temp. miez AF02", "CCP tratament termic ≥ 70 °C", "12.03.2026", "12.03.2027"],
          ["Termometru CF01", "Recepție materie primă 0–4 °C", "20.01.2026", "20.01.2027"],
          ["Termometru DEP01", "Depozit produs finit 0–4 °C", "20.01.2026", "20.01.2027"],
          ["Etaloane test DM01 (Fe 2,0 / NFe 2,5 / Inox 3,0 mm)", "CCP detector metale", "05.06.2026", "05.06.2027"],
          ["Cântar recepție CN01", "Metrologie legală", "02.12.2025", "02.12.2026"]] },
      nota: "Atenție: CN01 expiră în 13 zile – verificare BRML programată 28.11.2026."
    }),
    "TEH 009": () => ({
      rezumat: "Ce piese și servicii trebuie cumpărate, cu ce specificații și cât de urgent?",
      campuri: [["Nr. referat", "RN-TEH-2026-0412"], ["Data", "19.11.2026"], ["Întocmit", "Șef Mentenanță"]],
      tabel: { cap: ["Cod", "Denumire", "Cant.", "Utilaj", "Urgență", "Specificație"],
        randuri: [["4410-218", "Garnitură piston umplere", "4 buc", "UMP01", "Mare", "PTFE, contact alimentar"],
          ["CT-500-6", "Set cuțite cutter", "1 set", "CUT01", "Medie", "6 cuțite, inox, original OEM"],
          ["RL-6205-2RS", "Rulment 6205 2RS", "6 buc", "TOC01", "Medie", "Unsoare H1"],
          ["FLT-AER-30", "Filtru aer compresor", "2 buc", "AER01", "Mică", "Grad filtrare 1 µm"],
          ["SRV-NH3", "Service anual stație frig", "1 serv.", "FRG01", "Mare", "Firmă autorizată ISCIR"]] },
      nota: "Valoare estimată: 38.900 lei. Furnizor preferat: furnizor OEM (contract ACH-T 001)."
    }),
    "TEH 010": () => ({
      rezumat: "Ce cerințe tehnice trebuie să îndeplinească echipamentul pe care îl cumpărăm?",
      campuri: [["Obiect", "Celulă afumare-fierbere nr. 3"], ["Capacitate", "min. 1.100 kg/șarjă, 4 cărucioare"],
        ["Temperatură", "30–120 °C, uniformitate ± 1 °C"], ["Sonde miez", "2 sonde, înregistrare CCP, export SCADA (OPC UA)"],
        ["Utilități", "abur 8 bar, 380 V / 45 kW, apă 3 bar"], ["Materiale", "inox AISI 304, contact alimentar"],
        ["Garanție / service", "24 luni, intervenție ≤ 24 h, piese 10 ani"], ["Termen livrare", "max. 16 săptămâni"]]
    }),
    "TEH 011": () => {
      const pl = safe(() => E().equipment.filter(e => (e.nextMaint - Date.now()) / 864e5 <= 7).sort((a, b) => a.nextMaint - b.nextMaint).slice(0, 6), []);
      return {
        rezumat: "Ce linii sunt disponibile săptămâna viitoare și când sunt oprite pentru mentenanță?",
        campuri: [["Săptămâna", "S48 (23–29.11.2026)"], ["Disponibilitate planificată", "96,8% (2 ture × 6 zile)"]],
        tabel: { cap: ["Utilaj", "Oprire planificată", "Durată"],
          randuri: pl.length ? pl.map((e, i) => [nm(e.id), dt(e.nextMaint), [2, 4, 3, 2, 1.5, 3][i] + " h"]) : [["—", "nicio oprire planificată", "—"]] },
        nota: "Planificarea producției (SCM-T 002) se face în jurul acestor ferestre."
      };
    },
    "TEH 012": () => {
      const c = safe(() => E().capacity(), null);
      return {
        rezumat: "Cât poate produce maxim linia, pe fiecare pas, și unde este gâtuirea?",
        campuri: c ? [["Capacitate nominală linie", nf(c.nominal) + " kg/h"], ["Ritm actual", nf(c.rate) + " kg/h"],
          ["Gâtuire", RACIRE(c.bottleneck.name)], ["Maxim pe tură (8 h)", nf(c.nominal * c.quality * 8 / 1000, 1) + " t"]] : [],
        tabel: c ? { cap: ["Pas", "Utilaje", "Nominal (kg/h)", "Actual (kg/h)"],
          randuri: c.steps.map(s => [RACIRE(s.name), s.ids.join(", "), nf(s.nominal), nf(s.actual)]) } : undefined,
        nota: "Valori după modernizarea cutter-ului (2026). Pasul cu cea mai mică capacitate dă ritmul liniei."
      };
    },
    "TEH 013": () => ({
      rezumat: "Când facem service la instalațiile de frig din depozite și pe camioane?",
      campuri: [["Luna", "Decembrie 2026"], ["Camioane frigorifice în plan", "42 din 300"], ["Depozite", "5 + cross-docking"]],
      tabel: { cap: ["Obiectiv", "Dată", "Operație", "Executant"],
        randuri: [["Depozit PF Cugir (DEP01)", "03.12.2026", "Curățare evaporatoare, control etanșeitate", "Frigotehnist intern"],
          ["Depozit Brașov", "08.12.2026", "Revizie compresor", "Furnizor service frig"],
          ["Cross-docking Sibiu", "10.12.2026", "Verificare F-gas (R404A)", "Firmă certificată"],
          ["Camioane B-101 … B-121", "01–12.12.2026", "Service agregat frigorific", "Atelier flotă"],
          ["Camioane B-122 … B-142", "14–23.12.2026", "Service agregat frigorific", "Atelier flotă"]] }
    }),
    "TEH 014": () => ({
      rezumat: "Ce s-a întâmplat la alarma de temperatură și cât a durat până la rezolvare?",
      tabel: { cap: ["Data/ora", "Loc", "Valoare", "Cauză", "Rezolvat"],
        randuri: [["17.11.2026 03:14", "Depozit Brașov – camera 2", "6,8 °C", "Ușă rămasă întredeschisă", "03:52"],
          ["18.11.2026 14:30", "Camion B-117", "9,1 °C", "Senzor defect agregat", "16:10 (marfa transferată)"],
          ["19.11.2026 07:05", "Rampă expediție RMP01", "11,2 °C", "Perdea aer oprită", "07:40"]] },
      campuri: [["Timp mediu de reacție", "52 min (țintă ≤ 3 h)"], ["Marfă afectată", "0 kg (temperaturi produs < 4 °C)"]],
      nota: "Mesaj SMS/e-mail către Manager Distribuție la fiecare intervenție."
    }),
    "TEH 015": () => ({
      rezumat: "Ce vitrine frigorifice din magazinele proprii am reparat și care mai sunt în lucru?",
      tabel: { cap: ["Magazin", "Vitrină", "Defect", "Status"],
        randuri: [["Cugir – Centru", "Vitrină semiverticală 2,5 m", "Ventilator evaporator", "Rezolvat 18.11 – 4 h"],
          ["Alba Iulia – Cetate", "Vitrină orizontală", "Pierdere agent R290", "Rezolvat 19.11 – 7 h"],
          ["Sebeș", "Vitrină self-service", "Termostat", "În lucru – piesă 20.11"]] },
      campuri: [["Timp mediu intervenție", "5,5 h (țintă ≤ 8 h)"]]
    }),
    "TEH 016": () => ({
      rezumat: "Ce cerințe tehnice trebuie să aibă spațiul pentru un magazin nou?",
      campuri: [["Magazin", "Deva – Bd. Decebal (propunere)"], ["Suprafață", "85 m² vânzare + 20 m² depozit"],
        ["Putere electrică necesară", "45 kW, trifazic, tablou dedicat frig"], ["Vitrine", "3 semiverticale 2,5 m + 1 orizontală 2 m"],
        ["Cameră frig depozit", "8 m³, 0–4 °C"], ["Agent frigorific", "R290 (propan), agregate plug-in"],
        ["Monitorizare", "senzori IoT temperatură, alarmă SMS"], ["Cost estimat echipare tehnică", "142.000 lei"]],
      nota: "Aviz: FAVORABIL cu condiția mărimii branșamentului la 50 kW."
    }),
    "TEH 017": () => {
      const c = safe(() => E().capacity(), null);
      return {
        rezumat: "Se poate produce produsul sau ambalajul nou cu utilajele pe care le avem?",
        campuri: [["Produs", "Salam crud-uscat feliat 80 g, caserolă MAP"], ["Linie", "Maturare MAT01 → feliere FEL01 → ambalare AMB01"],
          ["Capacitate disponibilă", c ? nf(c.nominal) + " kg/h linie" : "1.800 kg/h linie"], ["Format nou de ambalaj", "necesită matriță termoformare (35.000 lei, 6 săptămâni)"],
          ["Cameră maturare", "ocupare 78% – loc pentru 4 t/lună"], ["Aviz", "FEZABIL – lansare posibilă din februarie 2027"]],
        nota: "Răspuns la briefurile MKT-T 001 / MKT-T 002."
      };
    },
    "TEH 018": () => ({
      rezumat: "De câți bani are nevoie Departamentul Tehnic anul viitor, pe categorii?",
      tabel: { cap: ["Categorie", "2026 realizat (lei)", "2027 propus (lei)"],
        randuri: [["OPEX – piese de schimb", "1.180.000", "1.240.000"], ["OPEX – servicii externe OEM", "640.000", "690.000"],
          ["OPEX – energie electrică + gaz", "9.850.000", "9.400.000"], ["OPEX – autorizări, verificări ISCIR", "85.000", "92.000"],
          ["CAPEX – investiții (TEH 002)", "2.100.000", "4.850.000"], ["Total", "13.855.000", "16.272.000"]] },
      nota: "Energia scade prin recuperarea de căldură și fotovoltaice (proiecte CAPEX)."
    }),
    "TEH 019": () => {
      const p = safe(() => eq("PT01").values.putere, 1450);
      return {
        rezumat: "Câtă energie am consumat luna trecută pe fiecare locație și cât a costat?",
        campuri: [["Perioada", "Octombrie 2026"], ["Putere medie fabrica Cugir", nf(p) + " kW"], ["Preț mediu", "0,85 lei/kWh"]],
        tabel: { cap: ["Locație", "kWh", "Gaz (MWh)", "Cost total (lei)"],
          randuri: [["Fabrica Cugir", "612.400", "1.380", "812.000"], ["Abator Cugir", "214.800", "420", "263.500"],
            ["Depozit Brașov", "48.300", "—", "41.100"], ["Cross-docking Sibiu", "22.900", "—", "19.500"], ["Magazine proprii (12)", "36.600", "—", "31.100"]] },
        nota: "Cost energie / kg produs: 0,38 lei (oct.) față de 0,41 lei (sept.)."
      };
    },
    "TEH 020": () => ({
      rezumat: "Echipamentul nou a fost recepționat, pus în funcțiune și poate fi înregistrat ca mijloc fix?",
      campuri: [["Nr. PV", "PV-REC-2026-031"], ["Data", "14.11.2026"], ["Echipament", "Compresor aer comprimat cu variator 55 kW"],
        ["Furnizor", "furnizor OEM (contract 118/2026)"], ["Valoare", "186.500 lei fără TVA"], ["Probe", "72 h funcționare, 7 bar, fără defecte"],
        ["Documente predate", "carte tehnică, declarație CE, garanție 24 luni"], ["Comisie", "Șef Tehnic, Șef Mentenanță, Contabil Mijloace Fixe"]],
      nota: "Data PIF = data de început a amortizării."
    }),
    "TEH 021": () => ({
      rezumat: "Ce echipamente propunem la casare și ce avem în inventarul tehnic?",
      tabel: { cap: ["Nr. inventar", "Echipament", "An PIF", "Stare", "Propunere"],
        randuri: [["MF-1032", "Mașină vacuum de masă", "2009", "Uzat, piese indisponibile", "Casare"],
          ["MF-1107", "Cuptor afumare vechi 2 cărucioare", "2011", "Înlocuit de AF01/AF02", "Casare + valorificare inox"],
          ["MF-1215", "Compresor aer piston 30 kW", "2012", "Înlocuit (PV-REC-2026-031)", "Casare"],
          ["MF-1340", "Tocător 130", "2014", "Funcțional, rezervă", "Păstrare"]] },
      campuri: [["Total echipamente inventariate", safe(() => E().equipment.length, 23) + " în SCADA + 214 în registrul tehnic"]]
    }),
    "TEH 022": () => ({
      rezumat: "De câți oameni și ce autorizări are nevoie Departamentul Tehnic?",
      tabel: { cap: ["Post", "Existent", "Necesar", "Autorizare"],
        randuri: [["Electrician", "4", "5", "ANRE gradul II"], ["Frigotehnist", "2", "3", "Certificat F-gas cat. I"],
          ["Fochist", "3", "3", "ISCIR – reautorizare 2027"], ["Automatist SCADA/PLC", "1", "2", "—"], ["Mecanic întreținere", "6", "6", "—"]] }
    }),
    "TEH 023": () => ({
      rezumat: "Ce trebuie să ofere sistemele informatice (CMMS, SCADA, IoT) Departamentului Tehnic?",
      tabel: { cap: ["Sistem", "Cerință", "Prioritate"],
        randuri: [["CMMS", "Ordine de lucru din mobil, cu foto și semnătură", "Mare"],
          ["CMMS", "Legătură cu ERP pentru referate piese (TEH 009)", "Mare"],
          ["SCADA", "Istoric 2 ani pentru parametrii CCP, export PDF", "Mare"],
          ["SCADA", `Conectare toate cele ${safe(() => E().equipment.length, 23)} utilaje, OPC UA`, "Medie"],
          ["IoT", "Senzori temperatură în 300 camioane + 12 magazine, alarmă SMS", "Mare"],
          ["IoT", "Contoare energie pe linii (kWh/kg)", "Medie"]] },
      nota: "Termen analiză IT: T1 2027."
    }),
    "TEH 024": () => ({
      rezumat: "Ce autorizații tehnice avem, până când sunt valabile și ce dosare pregătim?",
      tabel: { cap: ["Autorizație", "Obiectiv", "Valabil până", "Stare dosar"],
        randuri: [["ISCIR – autorizare funcționare", "Centrală abur CAZ01", "14.03.2027", "În pregătire (depunere 01.2027)"],
          ["ISCIR – verificare periodică", "Stație frig NH3 FRG01", "02.12.2026", "Depus 05.11.2026"],
          ["ANRE – atestat electricieni", "Post trafo PT01", "30.09.2027", "Valabil"],
          ["ISU – autorizație securitate la incendiu", "Hală producție", "nelimitat (verificare anuală 03.2027)", "Valabil"],
          ["Autorizație de mediu", "Stație epurare EPU01", "30.06.2028", "Valabil"]] },
      nota: "Calendarul se corelează cu JUR-T 002."
    }),
    "TEH 025": () => ({
      rezumat: "Ce echipamente sub presiune și instalații cu agenți F-gas avem și când se verifică?",
      tabel: { cap: ["Echipament", "Tip / agent", "Cantitate", "Următoarea verificare"],
        randuri: [["FRG01 Stație frig", "NH3 (R717)", "850 kg", "02.12.2026"], ["CAZ01 Centrală abur", "Recipient sub presiune 10 bar", "—", "14.03.2027"],
          ["AER01 Rezervor aer", "Recipient 2.000 L", "—", "20.05.2027"], ["Agregate depozit Brașov", "R404A", "48 kg (≈188 t CO₂e)", "10.12.2026 (semestrial)"]] }
    }),
    "TEH 026": () => ({
      rezumat: "Instalațiile PSI, electrice și de paratrăsnet au fost verificate și sunt conforme?",
      tabel: { cap: ["Instalație", "Verificat", "Rezultat", "Următoarea"],
        randuri: [["Hidranți interiori + sprinklere", "10.03.2026", "Conform", "03.2027"], ["Detecție și semnalizare incendiu", "10.03.2026", "Conform", "03.2027"],
          ["Priză de pământ / paratrăsnet", "22.04.2026", "Conform (2,1 Ω)", "04.2027"], ["Instalație electrică – termoviziune tablouri", "15.09.2026", "1 neconformitate remediată", "09.2027"]] }
    })
  };
})();
