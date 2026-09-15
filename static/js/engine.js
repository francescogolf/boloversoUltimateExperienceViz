// KPI Engine — shared state for all charts
// W/S adjust level, P toggles power, L toggles chaos mode.

export class KPIEngine {
    constructor() {
        this.level = 0.5;
        this.targetLevel = 0.5;
        this.power = 1;
        this.targetPower = 1;
        this.chaos = 0;
        this.targetChaos = 0;
        this._noise = {};
        const keys = [
            "throughputA", "throughputB", "heartRate", "efficiency",
            "load", "latency", "saturation", "pressure", "flowRate"
        ];
        for (const k of keys) {
            this._noise[k] = {
                p1: Math.random() * 1000,
                p2: Math.random() * 1000
            };
        }
    }

    nudge(direction) {
        if (this.targetPower < 0.5) return;
        this.targetLevel = Math.max(
            0,
            Math.min(1.0, this.targetLevel + direction * 0.12)
        );
    }

    togglePower() {
        if (this.targetPower > 0.5) {
            this.targetPower = 0;
        } else {
            this.targetPower = 1;
            this.targetLevel = 0.3;
        }
    }

    toggleChaos() {
        if (this.targetChaos > 0.5) {
            this.targetChaos = 0;
            this.targetLevel = 0.3;
        } else {
            this.targetChaos = 1;
        }
    }

    tick() {
        this.level += (this.targetLevel - this.level) * 0.18;
        this.power += (this.targetPower - this.power) * 0.08;
        // chaos: fast on (~3s), slow off (~10s)
        const chaosSpeed = this.targetChaos > 0.5 ? 0.35 : 0.12;
        this.chaos += (this.targetChaos - this.chaos) * chaosSpeed;
        const L = this.level;
        const P = this.power;
        const C = this.chaos;

        const n = (key, amp) => {
            const s = this._noise[key];
            s.p1 += 0.025 + Math.random() * 0.01;
            s.p2 += 0.063 + Math.random() * 0.015;
            return (
                Math.sin(s.p1) * 0.55 +
                Math.sin(s.p2) * 0.30 +
                (Math.random() - 0.5) * 0.15
            ) * amp;
        };

        // chaos amplifies noise and adds random spikes
        const cm = 1 + C * 6;
        const spike = (amp) => C * (Math.random() - 0.3) * amp;

        // Volatility: constant & small, with periodic gentle pulses
        const t = Date.now() / 1000;
        const breath = 0.5 + 0.3 * Math.sin(t * 0.4) + 0.2 * Math.sin(t * 0.17);
        const trendAmp = (2.5 + breath * 12) * P * cm;
        const baseT = L * 100 * P;

        return {
            level:       L,
            power:       P,
            chaos:       C,
            throughputA: baseT + n("throughputA", trendAmp) + spike(50),
            throughputB: baseT + n("throughputB", trendAmp) + spike(50),
            heartRate:   (70 + L * 50 + n("heartRate", 4) + spike(80)) * P,
            efficiency:  (L * 55 + 35  + n("efficiency", 22 * cm) + spike(30)) * P,
            load:        (L * 65 + 20  + n("load", 20 * cm) + spike(30)) * P,
            latency:     ((1 - L) * 140 + 25 + n("latency", 25 * cm) + spike(40)) * P,
            saturation:  (L * 75 + 15  + n("saturation", 25 * cm) + spike(30)) * P,
            pressure:    (L * 25 + 60  + n("pressure", 16 * cm) + spike(25)) * P,
            flowRate:    (L * 75 + 8   + n("flowRate", 22 * cm) + spike(25)) * P,
        };
    }
}
