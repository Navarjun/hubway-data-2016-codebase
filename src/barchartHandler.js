/*jshint esversion: 6*/
import * as d3 from "d3";

function createBarChart(data, plot, canvasSize, xaxis=d=>d.gender) {
    let _data = data.map(d => {
        d.week = d.startDate.getWeek();
        return d;
    });
    let _plot = plot, _canvas = canvasSize, _xaxis = xaxis, _scaleX, _scaleY;

    function exports(yaxis="number") {
        let rollUpFn = d=>d.length;
        if (yaxis == "duration") {
            rollUpFn = d=>d3.sum(d, e=>e.duration);
        }
        let nest = d3.nest()
            .key(_xaxis)
            .rollup(rollUpFn)
            .entries(_data);

        if (!_scaleY) {
            _scaleY = d3.scaleBand()
                .domain(nest.map(d=>d.key));
        }
        _scaleY
            .range([0, _canvas.height])
            .paddingInner(0.3)
    	    .paddingOuter(0.3)
    	    .align(0.5);
        if (!_scaleX) {
            _scaleX = d3.scaleLinear()
                .domain([0, d3.max(nest, d=>d.value)]);
        }
        _scaleX.range([0, _canvas.width]);
        let g = _plot.select("g.barChart");
        if (!g.node()) {
            g = _plot.append("g").classed("barChart", true);
        }


        // TAKING CARE OF THE AXIS
        const axisX = d3.axisTop().scale(_scaleX).tickFormat(d=>d).tickSize(_canvas.height);
        const axisY = d3.axisLeft().scale(_scaleY).tickSize(-_canvas.width).ticks(5);

        if (yaxis == "duration") {
            const minStep = _scaleX.domain()[1]/5;
            const step = parseInt(minStep) + parseInt(parseInt(minStep)/(60*60));
            axisX.tickFormat(d=>(Math.round(d/(60*60)))+" hours")
                .tickValues(d3.range(0, _scaleX.domain()[1], step));
        }

        let axisYG = g.select(".axisY");
        if (!axisYG.node()) {
            axisYG = g.append("g").attr("class", "axis axisY");
        }
        axisYG.transition().call(axisY);

        let axisXG = g.select(".axisX");
        if (!axisXG.node()) {
            axisXG = g.append("g")
                .attr("class", "axis axisX")
                .attr("transform", `translate(0, ${_canvas.height})`);
        }
        axisXG.transition().call(axisX);

        const bars = g.selectAll("rect")
            .data(nest, _xaxis);
        bars.exit().transition().style("opacity", "0").remove();
        bars.enter()
            .append("rect")
            .attr("height", _scaleY.bandwidth())
            .attr("y", d=>_scaleY(d.key))
            .merge(bars)
            .transition()
            .attr("width", d=>_scaleX(d.value))
            .attr("x", 0);
    }

    exports.scaleX = function(d) {
        if (arguments.length === 0) {
            return _scaleX;
        }
        _scaleX = d;
        return this;
    };

    exports.scaleY = function(d) {
        if (arguments.length === 0) {
            return _scaleY;
        }
        _scaleY = d;
        return this;
    };

    exports.maxValue = function(yaxis="number") {
        let rollUpFn = d=>d.length;
        if (yaxis == "duration") {
            rollUpFn = d=>d3.sum(d, e=>e.duration);
        }
        let nest = d3.nest()
            .key(_xaxis)
            .rollup(rollUpFn)
            .entries(_data);
        return d3.max(nest, d=>d.value);
    };

    return exports;
}

export default createBarChart;
