# ELIT SCADA – Departament Tehnic (simulare)

Proiect de curs („Maparea Legăturilor Structurale”). Simulează un sistem SCADA pentru Departamentul Tehnic al unei fabrici de mezeluri: harta halei, starea și controlul utilajelor, alarme, mentenanță, capacitate de producție și schimbul de informații cu celelalte departamente.

**Toate datele sunt fictive. Acesta nu este un sistem oficial ELIT.**

## Pornire locală

```
npm start
```

Apoi deschide http://localhost:8080. Pagina se reîncarcă singură când modifici fișierele. Pe Windows merge și dublu-click pe `start-server.bat`.

Fără server: deschide direct `index.html` în browser.

## Publicare pe Vercel

1. Urcă folderul pe GitHub.
2. În Vercel: **Add New → Project** → alege repo-ul.
3. Framework Preset: **Other**. Build Command: gol. Output Directory: gol (rădăcina).
4. **Deploy.**

## Structură

| Fișier | Rol |
|---|---|
| `index.html` | pagina și taburile |
| `css/style.css` | stiluri (sistemul de design Geist) |
| `js/data.js` | utilaje, departamente, fluxuri, livrabile TEH |
| `js/core.js` | motorul de simulare (valori, alarme, comenzi, capacitate) |
| `js/view-*.js` | câte un fișier pentru fiecare tab |
| `dev/server.js` | server local minimal (doar pentru lucru local; e în `dev/` ca Vercel să nu-l ruleze) |
