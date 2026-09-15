import { KPIEngine }  from "./engine.js";
import { TrendChart } from "./charts/trend.js";
import { ECGChart }   from "./charts/ecg.js";
import { BarsChart }  from "./charts/bars.js";
import { OverlayFX }  from "./charts/overlay.js";

var engine  = new KPIEngine();
var overlay = new OverlayFX();

var charts = [
    new TrendChart(document.getElementById("trend-container")),
    new ECGChart(document.getElementById("ecg-container")),
    new BarsChart(document.getElementById("bars-container")),
];

var kpis          = engine.tick();
var lastTick      = 0;
var lastTrendPush = 0;
var TREND_MS      = 50;

document.addEventListener("keydown", function(e) {
    var k = e.key.toLowerCase();
    if (k === "w") engine.nudge(+1);
    if (k === "s") engine.nudge(-1);
    if (k === "p") engine.togglePower();
    if (k === "l") engine.toggleChaos();
});

function frame(ts) {
    try {
        if (ts - lastTick >= 500) {
            kpis = engine.tick();
            charts[2].update(kpis);
            lastTick = ts;
        }

        if (ts - lastTrendPush >= TREND_MS) {
            var j = kpis.level * kpis.power * 2;
            var trendKpis = {
                throughputA: kpis.throughputA + (Math.random() - 0.5) * j,
                throughputB: kpis.throughputB + (Math.random() - 0.5) * j,
                chaos: kpis.chaos,
            };
            charts[0].update(trendKpis);
            lastTrendPush = ts;
        }

        // Bars: also update on fast cadence during chaos
        if ((kpis.chaos || 0) > 0.5) {
            charts[2].update(kpis);
        }

        charts[1].update(kpis);
        overlay.update(kpis);
    } catch (err) {
        console.error("frame error:", err);
    }

    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.addEventListener("resize", function() {
    charts.forEach(function(c) { c.resize(); });
    overlay.resize();
});
