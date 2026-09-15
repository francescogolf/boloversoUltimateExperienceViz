// ECG sweep — Canvas-based for authentic CRT phosphor-decay look.
// heartRate from engine controls PQRST frequency; cursor sweeps L→R.

export class ECGChart {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");

        this.cursorX = 0;
        this.ecgPhase = 0;
        this.prevY = null;
        this.heartRate = 72;
        this.width = 0;
        this.height = 0;

        this._setup();
    }

    /* ---- sizing ---- */
    _setup() {
        const r = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.width = r.width;
        this.height = r.height;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.cursorX = 0;
        this.prevY = null;
    }

    /* ---- PQRST waveform (phase 0…1) ---- */
    _wave(phase) {
        const p = ((phase % 1) + 1) % 1;
        if (p < 0.06) return 0;
        if (p < 0.10) return 0.12 * Math.sin(((p - 0.06) / 0.04) * Math.PI);
        if (p < 0.15) return 0;
        if (p < 0.17) return -0.08;
        if (p < 0.20) {
            const t = (p - 0.17) / 0.03;
            return -0.08 + 1.08 * Math.sin(t * Math.PI * 0.5);
        }
        if (p < 0.23) {
            const t = (p - 0.20) / 0.03;
            return Math.cos(t * Math.PI * 0.5) * (1 - t) + -0.18 * t;
        }
        if (p < 0.28) return -0.18 * (1 - (p - 0.23) / 0.05);
        if (p < 0.40) return 0;
        if (p < 0.52) return 0.20 * Math.sin(((p - 0.40) / 0.12) * Math.PI);
        return 0;
    }

    /* ---- per-frame update ---- */
    update(kpis) {
        this.heartRate = kpis.heartRate;
        this._chaos = kpis.chaos || 0;
        const ctx = this.ctx;

        // instant blackout when power is off
        if ((kpis.power ?? 1) < 0.5) {
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, this.width, this.height);
            this.prevY = null;
            return;
        }

        const step = 3; // pixels per frame

        // phosphor fade
        ctx.fillStyle = "rgba(0,0,0,0.04)";
        ctx.fillRect(0, 0, this.width, this.height);

        for (let i = 0; i < step; i++) {
            this.cursorX = (this.cursorX + 1) % this.width;

            // erase gap ahead of cursor
            ctx.fillStyle = "#000";
            ctx.fillRect(this.cursorX + 1, 0, 18, this.height);

            // advance ECG phase (heartRate drives frequency)
            this.ecgPhase += (this.heartRate / 72) * (3.5 / this.width);

            const val = this._wave(this.ecgPhase);
            const cy = this.height * 0.5;
            const amp = this.height * 0.35;
            const y = cy - val * amp;

            // line segment
            if (this.prevY !== null) {
                var chaosOn = (this._chaos || 0) > 0.5;
                var col = chaosOn
                    ? "hsl(" + ((Date.now() / 15) % 360) + ",80%,60%)"
                    : "#ff7070";
                ctx.beginPath();
                ctx.moveTo(this.cursorX - 1, this.prevY);
                ctx.lineTo(this.cursorX, y);
                ctx.strokeStyle = col;
                ctx.lineWidth = 2.5;
                ctx.shadowColor = col;
                ctx.shadowBlur = 12;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }


            this.prevY = y;
        }
    }

    resize() {
        this._setup();
    }
}
