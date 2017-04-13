/*jshint esversion: 6*/
import * as d3 from "d3";
import lineChart from "./modules/lineChart";
import areaChart from "./modules/areaChart";


function createLineChart(data, plot, canvasSize) {
    let _data = data.map(d => {
        d.week = d.startDate.getWeek();
        return d;
    });
    let _plot = plot, _canvas = canvasSize;

    function exports(yaxis="number", breakdownAxis="userType") {
        let rollUpFn = d=>d.length;
        if (yaxis == "duration") {
            rollUpFn = d=>d3.sum(d, e=>e.duration);
        }
        let nest = d3.nest()
            .key(d=>d.week)
            .sortKeys((a, b)=>(+a)-(+b))
            .rollup(rollUpFn)
            .entries(_data);
        nest.forEach(d=> { d.key = +d.key; });

        d3.range(1, 54, 1).forEach(i => {
            if (nest.filter(d=>d.key == i).length === 0) {
                nest.push({ key: i, value: 0 });
            }
        });
        nest = nest.sort((a, b) => a.key-b.key);
        nest.push({key: 54, value: 0});
        const scaleX = d3.scaleLinear()
            .domain([1, 54])
            .range([0, _canvas.width]);
        const scaleY = d3.scaleLinear()
            .domain([0, d3.max(nest, d=>d.value)])
            .range([_canvas.height, 0]);

        const timeseries = lineChart()
            .x(d=>scaleX(d.key))
            .y(d=>scaleY(d.value));

        let g = _plot.select("g.timeseries");
        if (!g.node()) {
            g = _plot.append("g").classed("timeseries", true);
        }
        let commulative = g.select("g.commulative");
        if (!commulative.node()) {
            commulative = g.append("g").classed("commulative", true);
        }
        commulative.datum(nest)
            .call(timeseries);


        let breakdown = g.select("g.breakdown");
        if (!breakdown.node()) {
            breakdown = g.append("g").classed("breakdown", true);
        }

        let keys = d3.extent(_data, d=>d[breakdownAxis]);
        let breakdownNest = d3.nest()
            .key(d=>d[breakdownAxis])
            .key(d=>d.week)
            .rollup(rollUpFn)
            .entries(_data);
        breakdownNest.forEach(d=> {
            d.values.forEach(e=> { e.key = +e.key; });
            d3.range(1, 55, 1).forEach(i => {
                if (d.values.filter(d=>d.key === i).length === 0) {
                    d.values.push({ key: i, value: 0 });
                }
            });
            d.values = d.values.sort((a, b) => a.key-b.key);
        });

        const commulation = d3.range(1, 55, 1).map(d=>0);
        breakdownNest.forEach(d=> {
            d.values.forEach((e, i) => {
                e.prev = commulation[i];
                commulation[i] += e.value;
                e.curr = commulation[i];
            });
        });

        const timeseriesArea = areaChart()
            .x(d=>scaleX(d.key))
            .y1(d=>scaleY(d.curr))
            .y0(d=>scaleY(d.prev));

        const breakdownGs = breakdown.selectAll("g")
            .data(breakdownNest);

        breakdownGs.exit().transition().remove();
        const paths = breakdownGs.enter()
            .append("g")
            .merge(breakdownGs)
            .attr("class", (d, i)=>{
                return breakdownAxis+d.key;
            })
            .selectAll("path")
            .data(d=>[d.values], (d,i)=>i);
        paths.exit().remove();
        paths.enter()
            .append("path")
            .merge(paths)
            .datum(function(d,i) {
                return d;
            })
            .call(timeseriesArea);



        // TAKING CARE OF THE AXIS
        const axisX = d3.axisBottom().scale(scaleX).tickFormat(d=>"week "+d).tickSize(_canvas.height);
        const axisY = d3.axisLeft().scale(scaleY).tickSize(-_canvas.width).ticks(5);

        if (yaxis == "duration") {
            const minStep = scaleY.domain()[1]/5;
            const step = parseInt(minStep) + parseInt(parseInt(minStep)/(60*60));
            axisY.tickFormat(d=>(Math.round(d/(60*60)))+" hours")
                .tickValues(d3.range(0, scaleY.domain()[1], step));
        }

        let axisYG = g.select(".axisY");
        if (!axisYG.node()) {
            axisYG = g.append("g").attr("class", "axis axisY");
        }
        axisYG.transition().call(axisY);

        let axisXG = g.select(".axisX");
        if (!axisXG.node()) {
            axisXG = g.append("g")
                .attr("class", "axis axisX");
        }
        axisXG.transition().call(axisX);
    }

    return exports;
}

export default createLineChart;
