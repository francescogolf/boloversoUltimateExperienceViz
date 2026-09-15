// Animated bar chart — bottom-right panel.
// 7 bars, gradient #F3B746 → #BE2D1A. Unit: 10⁻³ mg/lt. Chaos-aware.

export class BarsChart {
    constructor(container) {
        this.chart = echarts.init(container);
        this.chart.setOption(this._base());
    }

    _defaultColors() {
        return ["#f3b746", "#eaa03e", "#e18937", "#d87230", "#cf5b28", "#c64421", "#be2d1a"];
    }

    _chaosColors() {
        var base = (Date.now() / 30) % 360;
        return [0,1,2,3,4,5,6].map(function(i) {
            return "hsl(" + ((base + i * 51) % 360) + ",80%,60%)";
        });
    }

    _barData(values, colors, solid) {
        return values.map(function(v, i) {
            var c = colors[i];
            return {
                value: Math.max(0, Math.min(100, v)),
                itemStyle: solid
                    ? { color: c }
                    : { color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
                            { offset: 0, color: c + "88" },
                            { offset: 1, color: c },
                        ]) },
            };
        });
    }

    _base() {
        return {
            animation: true,
            animationDuration: 450,
            animationEasing: "cubicInOut",
            backgroundColor: "transparent",
            grid: { top: 25, right: 15, bottom: 15, left: 40 },
            xAxis: {
                type: "category",
                show: false,
                data: ["A", "B", "C", "D", "E", "F", "G"],
            },
            yAxis: {
                type: "value",
                show: true,
                max: 100,
                axisLine: { lineStyle: { color: "#333" } },
                axisTick: { lineStyle: { color: "#333" } },
                axisLabel: { color: "#555", fontSize: 9 },
                splitLine: { lineStyle: { color: "#1a1a1a" } },
                name: "10⁻³ mg/lt",
                nameTextStyle: { color: "#666", fontSize: 9 },
                nameLocation: "end",
                nameGap: 8,
            },
            series: [
                {
                    type: "bar",
                    data: this._barData([50,50,50,50,50,50,50], this._defaultColors(), false),
                    barWidth: "75%",
                    itemStyle: { borderRadius: [4, 4, 0, 0] },
                    label: {
                        show: true,
                        position: "top",
                        color: "#888",
                        fontSize: 10,
                        formatter: function(p) { return Math.round(p.value); },
                    },
                },
            ],
        };
    }

    update(kpis) {
        var P = kpis.power ?? 1;
        var chaosOn = (kpis.chaos || 0) > 0.5;
        var colors = chaosOn ? this._chaosColors() : this._defaultColors();
        var vals = [
            kpis.pressure,                     // always high (~60-85)
            kpis.efficiency,                   // mid-high (~35-90)
            kpis.throughputA,                  // follows trend (0-100)
            kpis.load,                         // mid (~20-85)
            100 * P - kpis.latency / 1.8,      // inverse (~8-86)
            kpis.saturation,                   // variable (~15-90)
            kpis.flowRate,                     // very variable (~8-83)
        ];
        this.chart.setOption({
            animationDuration: chaosOn ? 100 : 450,
            series: [{
                data: this._barData(vals, colors, chaosOn),
                label: { color: chaosOn ? "#fff" : "#888" },
            }],
        });
    }

    resize() {
        this.chart.resize();
    }
}
