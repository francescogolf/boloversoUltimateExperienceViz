# 02 — Engine KPI

## Scopo

`static/js/engine.js` esporta la classe `KPIEngine`: un generatore di metriche fittizie condivise da tutti i grafici. Il design garantisce che i grafici appaiano correlati tra loro (stessi KPI usati da più chart) e che i valori si muovano in modo organico (rumore smooth, non puramente random).

## Metriche generate

| KPI | Formula | Range tipico | Usato da |
|-----|---------|-------------|----------|
| `level` | `this.level` (esposto direttamente) | 0.03–1.0 | disponibile per tutti i chart |
| `power` | `this.power` (0→1, smooth) | 0–1 | moltiplicatore globale, esposto a tutti i chart |
| `throughputA` | `L × 100 × P + noise(trendAmp)` | 0–~128 | Trend line (rossa), Bars |
| `throughputB` | `L × 100 × P + noise(trendAmp)` | 0–~128 | Trend line (blu) — stessa base di A, rumore indipendente → incroci frequenti |
| `heartRate` | `(70 + L × 50 + noise(4) + spike(80)) × P` | 0–120 (normal), wild in chaos | ECG (frequenza picchi) |
| `efficiency` | `(L × 55 + 35 + noise(18)) × P` | 0–108 | Bars |
| `load` | `(L × 65 + 20 + noise(14)) × P` | 0–99 | Bars |
| `latency` | `((1-L) × 140 + 25 + noise(25)) × P` | 0–190 | Bars (100×P - lat/1.8) |
| `pressure` | `(L × 25 + 60 + noise(16×cm) + spike(25)) × P` | 0–85 | Bars — naturalmente alta |
| `flowRate` | `(L × 75 + 8 + noise(22×cm) + spike(25)) × P` | 0–83 | Bars — molto variabile |
| `saturation` | `(L × 75 + 15 + noise(22)) × P` | 0–112 | Bars |

> **trendAmp** = `(2.5 + breath × 5) × P × cm` — ampiezza rumore INDIPENDENTE dal livello.
> `breath` = pulsazione periodica (sin lenta ~15s + sin ~37s), range 0–1. Le linee oscillano stretto (~2.5) e periodicamente si allargano (~7.5), poi tornano. Nessuna divergenza a valori alti.

`L` = `this.level` (0.03–1.0), valore smooth che insegue `targetLevel`.

## Variabile di controllo: `power` (on/off)

- **`targetPower`**: 0 (off) o 1 (on), toggle con tasto P
- **`power`**: insegue `targetPower` con interpolazione: `power += (target - power) × 0.08`
- Convergenza lenta (~20 tick / 10s al 90%) → fade-out/fade-in graduale
- Tutte le KPI moltiplicate per `power` → a P=0 tutto va a zero
- `nudge(W/S)` ignorato quando `targetPower < 0.5`
- Al riaccensione (P on): `targetLevel` resettato a 0.3 (medio-basso)

## Variabile di controllo: `chaos` (L key)

- **`targetChaos`**: 0 (off) o 1 (on), toggle con tasto L
- **`chaos`**: transizione rapida in ON (speed 0.35, ~3s) e lenta in OFF (speed 0.12, ~10s)
- **Effetti su KPI**: moltiplicatore rumore `cm = 1 + C × 6` (7x a pieno chaos) + spike casuali su ogni metrica
- **Effetti visivi**: colori HSL rotanti su tutti i grafici, overlay con confetti/laser/glitch
- Al disattivazione: `targetLevel` resettato a 0.3 (medio-basso)

## Variabile di controllo: `level`

- **`targetLevel`**: modificato da W (+0.12) e S (-0.12), clampato a [0, 1.0]
- **`level`**: insegue `targetLevel` con interpolazione esponenziale: `level += (target - level) × 0.18`
- Convergenza rapida (~10 tick / 5 secondi per raggiungere il 90%)

### Effetto sui grafici

| Azione | throughput | heartRate | efficiency/load/saturation | latency |
|--------|-----------|-----------|---------------------------|---------|
| W (↑ level) | ↑ sale | ↑ più battiti/sec | ↑ salgono | ↓ scende |
| S (↓ level) | ↓ scende | ↓ meno battiti/sec | ↓ scendono | ↑ sale |

`latency` è l'unico KPI inversamente proporzionale a `level` — simula che un sistema sotto carico basso ha latenza alta.

## Algoritmo di rumore

Ogni KPI ha due oscillatori sinusoidali indipendenti + una componente random pura:

```
noise(key, amplitude) =
    sin(phase1) × 0.55 × amp          // onda lenta
  + sin(phase2) × 0.30 × amp          // onda veloce (freq ~2.5× la lenta)
  + random(-0.5, +0.5) × 0.15 × amp   // jitter
```

- `phase1` avanza di `0.025 + random(0.01)` per tick → periodo ~250 tick (~2 min)
- `phase2` avanza di `0.063 + random(0.015)` per tick → periodo ~100 tick (~50s)
- L'avanzamento leggermente randomizzato impedisce pattern visivamente ripetitivi
- Ogni KPI ha fasi iniziali diverse (seed random al costruttore)

## Tick rate

`engine.tick()` viene chiamato ogni **500ms** da `app.js`. L'ECG legge `heartRate` dal KPI snapshot più recente ma si aggiorna a ogni frame (60fps) per smoothness.

## Estensibilità

Per aggiungere un nuovo KPI:
1. Aggiungere la chiave nell'array `keys` del costruttore (crea lo stato noise)
2. Aggiungere la formula nel return di `tick()`
3. Usarlo nei chart che lo necessitano
