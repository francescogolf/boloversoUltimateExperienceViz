# 04 — Interazione e Loop di Rendering

## Tastiera

| Tasto | Azione | Effetto |
|-------|--------|---------|
| **W** | `engine.nudge(+1)` | `targetLevel += 0.12` (max 1.0) — KPI migliorano |
| **S** | `engine.nudge(-1)` | `targetLevel -= 0.12` (min 0.03) — KPI peggiorano |
| **P** | `engine.togglePower()` | Toggle power: off → tutti i KPI fade a 0; on → ripartenza a level 0.3 |
| **L** | `engine.toggleChaos()` | Toggle chaos: on → colori random, effetti overlay, valori impazziti (~3s transizione); off → normalità (~10s), level 0.3 |

- Listener: `document.addEventListener("keydown", ...)` in `app.js`
- Case-insensitive (`e.key.toLowerCase()`)
- Nessun debounce — ogni pressione è un nudge discreto
- La convergenza smooth di `level` verso `targetLevel` impedisce salti bruschi

### Comportamento percepito (power)
- **P (spegnimento)**: trend e barre si spengono fluidamente (~10s). ECG si spegne **di colpo** (blackout istantaneo).
- **P (riaccensione)**: sistema riparte da livello medio-basso (0.3). Fade-in graduale.
- **W/S ignorati** quando il sistema è spento.

### Comportamento percepito (level)
- **W ripetuto**: throughput sale, battito cardiaco accelera, barre salgono, latenza scende
- **S ripetuto**: throughput scende, battito rallenta, barre scendono, latenza sale
- **Nessun tasto**: i grafici continuano a oscillare attorno al livello corrente (rumore)
- L'effetto di W/S è rapido (~5 secondi per stabilizzarsi al nuovo livello)

## Loop di rendering (`app.js`)

Due cadenze distinte gestite in un unico `requestAnimationFrame` loop:

```
requestAnimationFrame(frame)
│
├── if (ts - lastTick >= 500ms):          // cadenza lenta
│   ├── kpis = engine.tick()              // nuovo snapshot KPI
│   └── charts[2].update(kpis)            // bars (ECharts)
│
├── if (ts - lastTrendPush >= 150ms):     // cadenza media
│   └── charts[0].update(kpis + jitter)   // trend (ECharts, micro-jitter)
│
├── charts[1].update(kpis)                // ECG (Canvas) — ogni frame
│
└── requestAnimationFrame(frame)          // prossimo frame
```

### Perché due cadenze?
- **Trend**: aggiornamento ogni 150ms con micro-jitter (±level×15) tra tick KPI → scorrimento fluido come l'ECG.
- **Bars**: aggiornamento ogni 500ms (sufficiente per transizioni animate ECharts).
- **ECG**: il sweep del cursore deve essere fluido e continuo. A 500ms si vedrebbero salti. Il canvas è leggero da aggiornare.

### Performance
- ECharts trend: `animation: false` → nessun overhead di transizione
- ECharts bars: `animation: true` con 450ms → transizioni smooth ma solo ogni 500ms
- Canvas ECG: ~2 pixel/frame, operazioni minimali (1 fillRect + 1 lineTo, nessun marcatore)
- Totale: impatto CPU molto basso, adatto anche a macchine non performanti

## Resize

```javascript
window.addEventListener("resize", () => charts.forEach(c => c.resize()));
```

- **ECharts** (trend, bars): `chart.resize()` ricalcola dimensioni automaticamente
- **Canvas** (ECG): `_setup()` ricalcola dimensioni, applica DPR, riempie di nero, resetta cursore a 0

Il resize dell'ECG causa un "reset" visivo (il canvas si svuota e il sweep ricomincia). È accettabile — il resize è un evento raro.

## Estensibilità — aggiungere un nuovo grafico

1. **Creare il modulo** `static/js/charts/nome.js`:
   ```javascript
   export class NomeChart {
       constructor(container) { /* init */ }
       update(kpis) { /* aggiorna con snapshot KPI */ }
       resize() { /* gestisci ridimensionamento */ }
   }
   ```

2. **Importare in `app.js`**:
   ```javascript
   import { NomeChart } from "./charts/nome.js";
   ```

3. **Aggiungere all'array `charts`** e decidere la cadenza:
   - Cadenza lenta (500ms): aggiungere `charts[N].update(kpis)` nel blocco `if (ts - lastTick >= 500)`
   - Cadenza veloce (rAF): aggiungere `charts[N].update(kpis)` fuori dal blocco if

4. **Aggiungere il contenitore HTML** in `index.html`:
   ```html
   <div id="nome-container" class="chart-box"></div>
   ```

5. **Adattare il CSS Grid** per il nuovo layout (righe/colonne/aree)

6. **Se servono nuovi KPI**: aggiungerli in `engine.js` (vedi 02-engine-kpi.md)

## Nota sui KPI condivisi

I 3 grafici attuali usano gli stessi KPI in modi diversi:
- `throughput` → trend line (valore diretto) + bars (÷11)
- `heartRate` → ECG (frequenza sweep)
- `efficiency`, `load`, `saturation` → bars (valori diretti)
- `latency` → bars (invertita)

Questo crea correlazioni visive naturali: quando W alza il livello, tutti i grafici reagiscono in modo coerente, dando l'impressione di un sistema interconnesso.
