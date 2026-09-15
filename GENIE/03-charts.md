# 03 — Charts

## 1. Trend Line (`charts/trend.js`)

**Tecnologia**: ECharts 5 (line chart)
**Posizione**: top, full-width (60% altezza)
**KPI**: `throughputA` (linea rossa), `throughputB` (linea blu)
**Cadenza aggiornamento**: ogni 150ms (con micro-jitter tra i tick KPI)

### Comportamento
- Buffer circolare di **80 punti** (~12 secondi di storia a 150ms/punto) — scorrimento visibile
- Ogni tick aggiunge un punto e rimuove il più vecchio (effetto scorrimento)
- Due linee smooth (fattore 0.3) senza simboli — stessa base, rumore indipendente → si incrociano frequentemente
- Perturbazione scala con level: più W → più ampiezza oscillazioni

### Stile attuale
| Proprietà | Valore |
|-----------|--------|
| Colore linea A | `#ff4757` (rosso) con glow `rgba(255,71,87,0.4)` |
| Colore linea B | `#3742fa` (blu) con glow `rgba(55,66,250,0.4)` |
| Larghezza linee | 2px |
| Glow | `shadowBlur: 8` per entrambe |
| Area fill | Gradient leggero 10% → 0% per ciascuna linea |
| Asse X | visibile (linea `#333`), no label, no tick |
| Asse Y | visibile (linea `#333`), label `#555` 10px, splitLine `#1a1a1a` |
| Y range | fisso 0%–100% (formatter `{value}%`, overflow ammesso) |
| Animation | `false` (aggiornamento diretto) |
| KPI overlay | bianco, 32px monospace bold, in alto a destra — media (A+B)/2 arrotondata, suffisso `%` |
| Background | trasparente (eredita nero da body) |

### Parametri configurabili
- `this.maxPoints` — lunghezza finestra temporale
- Y `min`/`max` — range asse verticale
- `smooth` — fattore curvatura (0 = spezzata, 1 = molto curva)
- Colori linea/area/glow

---

## 2. ECG Sweep (`charts/ecg.js`)

**Tecnologia**: HTML5 Canvas (rendering diretto)
**Posizione**: bottom-left (40% altezza × 50% larghezza)
**KPI**: `heartRate` (controlla frequenza picchi, NON altezza)
**Cadenza aggiornamento**: ogni frame (~60fps via requestAnimationFrame)

### Comportamento
1. Un cursore luminoso si muove da sinistra a destra (2 pixel/frame)
2. Disegna la forma d'onda PQRST dell'elettrocardiogramma
3. Davanti al cursore: gap nero (18px di "gomma")
4. Dietro al cursore: scia che si dissolve gradualmente (effetto fosforo CRT)
5. Quando il cursore raggiunge il bordo destro, ricomincia da sinistra
6. **Power off (P)**: blackout istantaneo — canvas nero di colpo, nessun fade. Al riaccensione il sweep riparte.

### Forma d'onda PQRST (fase 0→1 = un battito completo)

```
Fase    Componente    Valore
0.00    baseline      0
0.06    P wave        picco 0.12 (sinusoide)
0.10    baseline      0
0.15    Q wave        -0.08
0.17    R wave        picco 1.0 (il picco principale)
0.20    S wave        -0.18
0.23    recovery      ritorno a 0
0.28    baseline      0
0.40    T wave        picco 0.20 (sinusoide)
0.52    baseline      0 (fino al prossimo battito)
```

### Frequenza dei picchi
- `phasePerPixel = (heartRate / 72) × (3.5 / canvasWidth)`
- A 72 BPM (baseline): ~3.5 cicli completi visibili nell'intera larghezza
- Con W (heartRate ↑ fino a ~180): picchi più ravvicinati, più cicli visibili
- Con S (heartRate ↓ fino a ~50): picchi più distanziati, meno cicli visibili

### Effetto fosforo CRT
- Ogni frame: overlay `rgba(0,0,0,0.04)` su tutto il canvas → dissolvenza graduale
- Gap ahead: rettangolo nero pieno davanti al cursore
- Segmento corrente: disegnato DOPO il fade → sempre luminoso
- Il decadimento da 100% a ~5% richiede ~75 frame (~1.3s a 60fps)

### Stile attuale
| Proprietà | Valore |
|-----------|--------|
| Colore traccia | `#ff7070` (rosso pallido) |
| Glow traccia | `shadowColor: #ff7070`, `shadowBlur: 12` |
| Larghezza linea | 2.5px |
| Fade rate | `rgba(0,0,0,0.04)` per frame |
| Gap eraser | 18px ahead |
| DPR | gestito via `setTransform` per rendering crisp su HiDPI |

### Parametri configurabili
- `step` (pixel/frame) — velocità sweep
- Fade alpha (0.04) — persistenza scia
- Eraser width (18px) — ampiezza gap
- Ampiezza verticale (`this.height × 0.35`)
- Colori traccia/dot/glow

---

## 3. Bar Chart (`charts/bars.js`)

**Tecnologia**: ECharts 5 (bar chart)
**Posizione**: bottom-right (40% altezza × 50% larghezza)
**KPI**: efficiency, load, saturation, throughput/11, 100-latency/1.8
**Cadenza aggiornamento**: ogni 150ms (con micro-jitter tra i tick KPI)

### Comportamento
- 7 barre verticali, ciascuna derivata da un KPI diverso
- Le barre salgono e scendono lentamente con transizioni animate (450ms, cubicInOut)
- Ogni barra ha un colore diverso con gradient verticale (base semitrasparente → top pieno)
- Valori clampati a [2, 100]

### Mapping KPI → barre

| Barra | KPI sorgente | Trasformazione | Colore |
|-------|-------------|----------------|--------|
| A | efficiency | diretto | `#ff7070` (rosso pallido) |
| B | load | diretto | `#ff8585` |
| C | saturation | diretto | `#ff9a9a` |
| D | throughputA | diretto (0-100) | `#ffb0b0` |
| E | latency | 100×P - lat/1.8 (power-safe) | `#ffc5c5` |

### Stile attuale
| Proprietà | Valore |
|-----------|--------|
| Animation | `true`, 450ms, `cubicInOut` |
| Bar width | 80% (barre ravvicinate) |
| Border radius | `[4, 4, 0, 0]` (top arrotondato) |
| Gradient | `LinearGradient(0,1,0,0)` — colore+88 (base) → colore pieno (top) |
| Asse Y | visibile, labels 0-100, unit name "10⁻³ mg/lt" |
| Label barre | show=true, position=top, valore arrotondato |
| Y max | 100 |
| Background | trasparente |

### Variabilità barre
Le ampiezze rumore nel motore KPI sono state aumentate e differenziate per barra:
efficiency=18, load=14, saturation=22, latency=25. Questo crea movimento ampio e non uniforme.

### Parametri configurabili
- `_colors()` — palette (array di 5 hex)
- `animationDuration` / `animationEasing`
- `barWidth`
- Border radius
- Y max
- Mapping KPI (nell'`update`)

---

## 4. Overlay FX (`charts/overlay.js`)

**Tecnologia**: HTML5 Canvas (full-screen, pointer-events:none, z-index:999)
**Posizione**: sovrapposto all'intero dashboard
**Attivazione**: `kpis.chaos > 0.1`
**Cadenza aggiornamento**: ogni frame (rAF)

### Effetti (spawn ogni 7-15s, irregolare)

| Tipo | Descrizione |
|------|-------------|
| Confetti | 70 particelle colorate cadono dall'alto con gravità e rotazione |
| Laser | 6 linee luminose casuali attraverso lo schermo, fade 1.5s |
| Glitch | 15 blocchi colorati che lampeggiano per ~0.8s |

### Chaos colors (nei chart)
- **Trend**: linee cambiano hue HSL in rotazione continua (hA, hA+120°)
- **ECG**: colore traccia ruota hue ogni frame
- **Bars**: 5 hue equidistanti (base + i×72°) rotanti
