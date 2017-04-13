/*jshint esversion: 6*/
import {area} from "d3";
function areaChart() {

    let _x, _y1, _y0;

    function exports(selection) {
        const areaGen = area()
            .x(_x)
            .y1(_y1)
            .y0(_y0);

        selection//.datum(d=>d)
            .transition()
            .attr("d", areaGen);
    }

    exports.x = function(x) {
        if (arguments.length === 0) {
            return _x;
        }
        _x = x;
        return this;
    };

    exports.y1 = function(y1) {
        if (arguments.length === 0) {
            return _y1;
        }
        _y1 = y1;
        return this;
    };

    exports.y0 = function(y0) {
        if (arguments.length === 0) {
            return _y0;
        }
        _y0 = y0;
        return this;
    };

    return exports;
}

export default areaChart;
