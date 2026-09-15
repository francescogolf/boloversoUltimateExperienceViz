# VIZ — Dashboard di visualizzazioni in tempo reale (fittizio)

## Panoramica

App Flask/Gunicorn che mostra un cruscotto con 3 visualizzazioni animate che simulano dati provenienti da sensori reali. Sfondo nero, nessun testo. I grafici sono alimentati da un motore KPI condiviso e rispondono ai tasti W/S per alzare/abbassare i livelli.

**Stato**: v1.1 — chaos mode (L), heartRate 70-120 BPM, barre con valori numerici e unità 10⁻³ mg/lt, overlay effetti (confetti/laser/glitch).

## Deploy

```bash
databricks apps deploy --app-name viz --source-code-path /Workspace/Users/francesco.golfieri@gruppohera.it/viz
```

> Il deploy è SEMPRE a carico dell'utente.

## File tree

```
viz/
├── app.py                       # Flask server (solo routing)
├── app.yaml                     # Databricks App config (gunicorn)
├── requirements.txt             # flask, gunicorn
├── GENIE/
│   ├── INDEX.md                 # ← questo file
│   ├── 01-architettura.md       # Stack, file tree, dipendenze
│   ├── 02-engine-kpi.md         # Motore KPI condiviso, metriche, rumore
│   ├── 03-charts.md             # I 3 grafici: trend, ECG, bars
│   └── 04-interazione.md        # Tastiera, loop rendering, resize
├── templates/
│   └── index.html               # SPA — layout CSS Grid, carica ECharts CDN + ES modules
└── static/
    └── js/
        ├── app.js               # Orchestratore: init, keyboard, rAF loop
        ├── engine.js             # KPIEngine — stato condiviso, tick ogni 500ms
        └── charts/
            ├── trend.js          # Linea scorrevole (ECharts) — throughput
            ├── ecg.js            # Sweep ECG (Canvas) — heartRate
            ├── bars.js           # Barre colorate (ECharts) — multi-KPI
            └── overlay.js        # Effetti chaos (Canvas full-screen)
```

## Documentazione di dettaglio

| File | Contenuto |
|------|-----------|
| [01-architettura.md](01-architettura.md) | Stack tecnologico, struttura Flask, dipendenze, layout HTML/CSS |
| [02-engine-kpi.md](02-engine-kpi.md) | Motore KPI: metriche, algoritmo rumore, relazioni tra grafici |
| [03-charts.md](03-charts.md) | Specifiche dei 3 grafici: trend, ECG, bars — parametri e tecnologie |
| [04-interazione.md](04-interazione.md) | Tastiera W/S, loop di rendering, timing, resize, estensibilità |

## TODO

- [ ] Definire palette colori definitiva (tutti i grafici)
- [x] Configurare assi (trend: X/Y visibili, stile dark) — v0.2
- [x] Aggiungere KPI numerici alle barre (valori + unità 10⁻³ mg/lt) — v0.8
- [ ] Quarto grafico (da definire)
- [ ] Test deploy come Databricks App
- [ ] Pulizia file orfani nella home directory (app.yaml, requirements.txt, app.py, templates/, static/ vuoti)
