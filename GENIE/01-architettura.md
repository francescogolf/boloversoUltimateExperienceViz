# 01 — Architettura

## Stack tecnologico

| Layer | Tecnologia | Note |
|-------|-----------|------|
| Server | Flask + Gunicorn | `app.py` espone solo `GET /` → `render_template("index.html")` |
| Frontend | HTML5 SPA | ES Modules, nessun bundler |
| Charting | ECharts 5 (CDN) | Trend line + bar chart |
| Canvas | HTML5 Canvas API | ECG sweep con effetto fosforo CRT |
| Config | `app.yaml` | `command: ["gunicorn", "app:app"]` |

## app.py

Server Flask minimale. Unica route `/` che serve `templates/index.html`. Nessuna business logic, nessuna API REST, nessun dato server-side. Tutta la logica è client-side in JavaScript.

```python
# Struttura:
# - Flask(__name__)
# - @app.route("/") → render_template("index.html")
# - if __name__ == "__main__": app.run(port=PORT)
```

## app.yaml

```yaml
command: ["gunicorn", "app:app"]
```

Nessuna porta specificata (Databricks la gestisce internamente).

## requirements.txt

```
flask
gunicorn
```

Nessuna dipendenza Python aggiuntiva — tutta la logica è JS client-side.

## Layout HTML (templates/index.html)

CSS Grid con 2 righe × 2 colonne:

```
┌──────────────────────────────────────┐
│         trend-container (60%)         │  ← grid-column: 1 / -1
├──────────────────┬───────────────────┤
│  ecg-container   │  bars-container   │  ← 40% altezza, 50/50 larghezza
│   (40% × 50%)    │   (40% × 50%)    │
└──────────────────┴───────────────────┘
```

- `grid-template-rows: 60% 40%`
- `grid-template-columns: 1fr 1fr`
- `gap: 4px`, `padding: 4px`
- Sfondo: `#000` (nero pieno)
- Overflow: `hidden` (nessuna scrollbar)

## Moduli JavaScript (ES Modules)

Entry point: `<script type="module" src="/static/js/app.js">`.

Dipendenze tra moduli:

```
app.js
├── import { KPIEngine }  from "./engine.js"
├── import { TrendChart } from "./charts/trend.js"
├── import { ECGChart }   from "./charts/ecg.js"
└── import { BarsChart }  from "./charts/bars.js"
```

ECharts è caricato via CDN (`<script>` globale) — disponibile come variabile globale `echarts` in tutti i moduli.

## Design modulare

Ogni grafico è una classe con interfaccia uniforme:
- `constructor(container)` — inizializzazione nel div contenitore
- `update(kpis)` — riceve snapshot KPI e aggiorna la visualizzazione
- `resize()` — gestisce ridimensionamento finestra

Per aggiungere un nuovo grafico:
1. Creare `static/js/charts/nuovo.js` con classe che espone `constructor`, `update`, `resize`
2. Importare in `app.js` e aggiungere all'array `charts`
3. Aggiungere un `<div>` in `index.html` e adattare il CSS Grid
4. Decidere se aggiornare a cadenza lenta (500ms, come trend/bars) o veloce (rAF, come ECG)
