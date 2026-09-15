// Chaos overlay — full-screen canvas for confetti, lasers, glitch.
// Active only when kpis.chaos > 0.1. Effects spawn every ~10s irregular.
// All effects are plain data objects — no closures.

export class OverlayFX {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.style.cssText =
            "position:fixed;top:0;left:0;width:100%;height:100%;" +
            "pointer-events:none;z-index:999";
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        this.w = 0;
        this.h = 0;
        this.particles = [];
        this.fx = [];
        this.nextSpawn = 0;
        this._sz();
    }

    _sz() {
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.canvas.width = this.w;
        this.canvas.height = this.h;
    }

    update(kpis) {
        var C = kpis.chaos || 0;
        var ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.h);
        if (C < 0.1) {
            this.particles = [];
            this.fx = [];
            return;
        }

        var now = Date.now();
        if (now > this.nextSpawn) {
            this._spawn(now);
            this.nextSpawn = now + 2000 + Math.random() * 2000;
        }

        this._drawParticles(ctx, C);
        this._drawFx(ctx, C, now);
        ctx.globalAlpha = 1;
    }

    _drawParticles(ctx, C) {
        var alive = [];
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12;
            p.r += p.vr;
            if (p.y < this.h + 30) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.r);
                ctx.globalAlpha = C * 0.85;
                ctx.fillStyle = p.c;
                ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
                ctx.restore();
                alive.push(p);
            }
        }
        this.particles = alive;
    }

    _drawFx(ctx, C, now) {
        var active = [];
        for (var j = 0; j < this.fx.length; j++) {
            var e = this.fx[j];
            var age = (now - e.born) / e.dur;
            if (age < 0 || age >= 1) {
                if (age < 0) active.push(e);
                continue;
            }
            ctx.globalAlpha = C * (1 - age);
            if (e.type === "laser") {
                ctx.beginPath();
                ctx.moveTo(e.x1, e.y1);
                ctx.lineTo(e.x2, e.y2);
                ctx.strokeStyle = e.col;
                ctx.lineWidth = 2;
                ctx.shadowColor = e.col;
                ctx.shadowBlur = 20;
                ctx.stroke();
                ctx.shadowBlur = 0;
            } else if (e.type === "glitch") {
                ctx.fillStyle = e.col;
                ctx.fillRect(e.gx, e.gy, e.gw, e.gh);
            }
            active.push(e);
        }
        this.fx = active;
    }

    _spawn(now) {
        var t = Math.floor(Math.random() * 3);
        var w = this.w, h = this.h;
        if (t === 0) {
            for (var i = 0; i < 70; i++) {
                this.particles.push({
                    x: w * 0.2 + Math.random() * w * 0.6,
                    y: -10 - Math.random() * 50,
                    vx: (Math.random() - 0.5) * 8,
                    vy: Math.random() * -3 + 2,
                    s: 4 + Math.random() * 8,
                    r: Math.random() * 6.28,
                    vr: (Math.random() - 0.5) * 0.3,
                    c: "hsl(" + Math.floor(Math.random() * 360) + ",80%,60%)",
                });
            }
        } else if (t === 1) {
            for (var k = 0; k < 6; k++) {
                this.fx.push({
                    type: "laser",
                    born: now + k * 120,
                    dur: 1500,
                    x1: Math.random() * w,
                    y1: Math.random() * h,
                    x2: Math.random() * w,
                    y2: Math.random() * h,
                    col: "hsl(" + Math.floor(Math.random() * 360) + ",100%,50%)",
                });
            }
        } else {
            for (var g = 0; g < 15; g++) {
                this.fx.push({
                    type: "glitch",
                    born: now + Math.random() * 600,
                    dur: 700 + Math.random() * 500,
                    gx: Math.random() * w,
                    gy: Math.random() * h,
                    gw: 20 + Math.random() * 120,
                    gh: 5 + Math.random() * 30,
                    col: "hsl(" + Math.floor(Math.random() * 360) + ",70%,50%)",
                });
            }
        }
    }

    resize() { this._sz(); }
}
