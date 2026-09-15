// Scrolling dual trend lines — full-width, top panel.
// Red (throughputA) + Blue (throughputB), axes visible, perturbation scales with level.

export class TrendChart {
    constructor(container) {
        this.maxPoints = 240;
        this.dataA = [];
        this.dataB = [];
        this.chart = echarts.init(container);
        this.chart.setOption(this._base());
    }

    _base() {
        const axisLine = { lineStyle: { color: "#333" } };
        return {
            animation: false,
            backgroundColor: "transparent",
            grid: { top: 20, right: 20, bottom: 30, left: 55 },
            xAxis: {
                type: "category",
                boundaryGap: false,
                data: [],
                axisLine: axisLine,
                axisTick: { show: false },
                axisLabel: { show: false },
                splitLine: { show: false },
            },
            yAxis: {
                type: "value",
                min: 0,
                max: 100,
                axisLine: axisLine,
                axisTick: { lineStyle: { color: "#333" } },
                axisLabel: { color: "#555", fontSize: 10, formatter: "{value}%" },
                splitLine: { lineStyle: { color: "#1a1a1a" } },
            },
            graphic: [{
                type: "text",
                right: 25,
                top: 5,
                style: {
                    text: "",
                    fill: "#fff",
                    fontSize: 32,
                    fontWeight: "bold",
                    fontFamily: "monospace",
                },
            }, {
                type: "text",
                right: 25,
                top: 42,
                style: {
                    text: "",
                    fill: "#ff3333",
                    fontSize: 14,
                    fontWeight: "bold",
                    fontFamily: "monospace",
                },
            }],
            series: [
                {
                    name: "A",
                    type: "line",
                    data: [],
                    smooth: 0.3,
                    symbol: "none",
                    lineStyle: {
                        color: "#ff4757",
                        width: 2,
                        shadowColor: "rgba(255,71,87,0.4)",
                        shadowBlur: 8,
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: "rgba(255,71,87,0.10)" },
                            { offset: 1, color: "rgba(255,71,87,0)" },
                        ]),
                    },
                },
                {
                    name: "B",
                    type: "line",
                    data: [],
                    smooth: 0.3,
                    symbol: "none",
                    lineStyle: {
                        color: "#3742fa",
                        width: 2,
                        shadowColor: "rgba(55,66,250,0.4)",
                        shadowBlur: 8,
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: "rgba(55,66,250,0.10)" },
                            { offset: 1, color: "rgba(55,66,250,0)" },
                        ]),
                    },
                },
            ],
        };
    }

    update(kpis) {
        this.dataA.push(kpis.throughputA);
        this.dataB.push(kpis.throughputB);
        if (this.dataA.length > this.maxPoints) {
            this.dataA.shift();
            this.dataB.shift();
        }
        var chaosOn = (kpis.chaos || 0) > 0.5;
        var sA = { data: this.dataA };
        var sB = { data: this.dataB };
        if (chaosOn) {
            var hA = (Date.now() / 20) % 360;
            var hB = (hA + 120) % 360;
            var cA = "hsl(" + hA + ",80%,60%)";
            var cB = "hsl(" + hB + ",80%,60%)";
            sA.lineStyle = { color: cA, shadowColor: cA };
            sA.areaStyle = { color: "transparent" };
            sB.lineStyle = { color: cB, shadowColor: cB };
            sB.areaStyle = { color: "transparent" };
        } else {
            sA.lineStyle = { color: "#ff4757", shadowColor: "rgba(255,71,87,0.4)" };
            sB.lineStyle = { color: "#3742fa", shadowColor: "rgba(55,66,250,0.4)" };
        }
        var avg = Math.round((kpis.throughputA + kpis.throughputB) / 2);
        if (avg < 0) avg = 0;
        var off = (kpis.power ?? 1) < 0.5;
        this.chart.setOption({
            graphic: [
                { style: { text: avg + "%" } },
                { style: { text: off ? "DISCONNECTED" : "" } }
            ],
            xAxis: { data: this.dataA.map((_, i) => i) },
            series: [sA, sB],
        });
    }

    resize() {
        this.chart.resize();
    }
}
