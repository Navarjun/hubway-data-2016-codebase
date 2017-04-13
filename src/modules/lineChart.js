/*jshint esversion: 6*/
import {line} from "d3";
function lineChart() {

    let _x, _y;

    function exports(selection) {
        const data = selection.datum() || [];
        let path = selection.select("path");
        if (!path.node()) {
            path = selection.append("path");
        }

        const lineGen = line()
            .x(_x)
            .y(_y);

        path.datum(data)
            .transition()
            .attr("d", lineGen);
    }

    exports.x = function(x) {
        if (arguments.length === 0) {
            return _x;
        }
        _x = x;
        return this;
    };

    exports.y = function(y) {
        if (arguments.length === 0) {
            return _y;
        }
        _y = y;
        return this;
    };

    return exports;
}

export default lineChart;
