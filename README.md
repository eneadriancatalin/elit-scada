# ELIT – Date tehnice pentru departamente

Proiect de curs („Maparea Legăturilor Structurale”). Aplicația arată ce date oferă **Departamentul Tehnic** al unei fabrici de mezeluri celorlalte departamente (livrabilele TEH 001–026) și ce primește de la ele (codurile -T), după documentele de mapare ELIT Tehnic.

**Valorile sunt exemplificative. Acesta nu este un sistem oficial ELIT.**

## Ecrane

| Tab | Ce arată |
|---|---|
| Departamente | catalogul: pentru fiecare departament, livrabilele pe care i le oferim (cu exemplu) și ce primim de la el |
| Flux informațional | toate legăturile intrare / ieșire, cu codurile din documente |
| Harta halei | planul fabricii; „Arată pentru” evidențiază utilajele relevante pentru un departament |
| Producție & capacitate | cât producem pe tură / zi / săptămână (TEH 011, TEH 012) |
| Mentenanță & KPI | plan mentenanță (TEH 003), KPI (TEH 001), energie (TEH 019) |

Bara „Vine cineva de la:” de sub meniu deschide direct departamentul respectiv.

## Pornire locală

```
npm start
```

Apoi deschide http://localhost:8080. Pagina se reîncarcă singură când modifici fișierele. Pe Windows merge și dublu-click pe `start-server.bat`. Fără server: deschide direct `index.html`.

## Publicare pe Vercel

Repo-ul e conectat la Vercel: fiecare push pe `main` republică site-ul. Setări: Framework Preset **Other**, fără Build Command, Output Directory gol.

## Structură

| Fișier | Rol |
|---|---|
| `index.html` | pagina și taburile |
| `css/style.css` | stiluri (sistemul de design Geist) și culorile departamentelor |
| `js/data.js` | utilaje, departamente, livrabile TEH 001–026 și intrări -T (din documentele de mapare) |
| `js/exemple.js` | exemplu de conținut pentru fiecare livrabil TEH |
| `js/core.js` | modelul datelor (valori fixe, KPI, capacitate) |
| `js/view-*.js` | câte un fișier pentru fiecare tab |
| `js/ghid.js` | ghidul „Cum folosești aplicația” |
| `dev/server.js` | server local minimal (doar pentru lucru local; e în `dev/` ca Vercel să nu-l ruleze) |
