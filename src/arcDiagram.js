/*jshint esversion: 6*/
import * as d3 from "d3";

function createArcDiagram(data, plot, canvasSize, stationDetailsMap) {
    let _data = data.map(d => {
        d.week = d.startDate.getWeek();
        return d;
    });
    let _plot = plot, _canvas = canvasSize, _scaleX, _scaleY;

    function exports(yaxis="number") {
        // const array = Object.keys(stationDetailsMap);
        const array = ["Somerville", "Brookline", "Boston", "Cambridge"];
        _scaleX = d3.scaleOrdinal()
            .domain(array)
            .range(d3.range(50, _canvas.width, _canvas.width/array.length));

        let g = _plot.select("g.arcDiagram");
        if (!g.node()) {
            g = _plot.append("g").classed("arcDiagram", true);
        }
        var dummy = d3.select(document.createElement("div")).append("svg");
        _scaleY = d3.scaleLinear()
            .domain([0, +d3.max(_data, d=>+d.duration)])
            .range([_canvas.height-50, 0]);
        const lineGen = d3.line().curve(d3.curveMonotoneX);
        const paths = g.selectAll("path")
            .data(_data);
        paths.exit().transition().remove();
        paths.enter()
            .append("path")
            .merge(paths)
            .attr("d", d=> {
                const startX = _scaleX(d.startMunicipality);
                const endX = _scaleX(d.endMunicipality);
                const midX = (startX+endX)/2;
                const midY = _scaleY(d.duration);
                var path = dummy.append("path")
                    .attr("d", lineGen([[startX, _canvas.height], [midX, midY], [endX, _canvas.height]]));
                d.pathLength = path.node().getTotalLength();
                return lineGen([[startX, _canvas.height], [midX, midY], [endX, _canvas.height]]);
            })
            .attr("stroke-dasharray", d=>d.pathLength + " " + d.pathLength)
            .attr("stroke-dashoffset", d=>d.pathLength)
            .transition()
            .duration(10000)
            .delay((d,i)=>100*i)
            .attr("stroke-dashoffset", 0);

        // AXIS HANDLER
        const axisX = d3.axisBottom().scale(_scaleX).tickSize(0);
        let axisXG = g.select(".axisX");
        if (!axisXG.node()) {
            axisXG = g.append("g")
                .attr("class", "axis axisX")
                .attr("transform", `translate(0, ${_canvas.height})`);
        }
        axisXG.transition().call(axisX);

        const axisY = d3.axisLeft().scale(_scaleY).tickSize(-_canvas.width).ticks(5);
        const minStep = +_scaleY.domain()[1]/5;
        const step = parseInt(minStep) + parseInt(parseInt(minStep)/(60.0*60));
        axisY.tickFormat(d=> {
            return ((d/(60*60)).toFixed(2))+" hours";
        });
        let axisYG = g.select(".axisY");
        if (!axisYG.node()) {
            axisYG = g.append("g").attr("class", "axis axisY");
        }
        axisYG.transition().call(axisY);
    }

    return exports;
}

export default createArcDiagram;
