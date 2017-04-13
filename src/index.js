/*jshint esversion: 6*/
import * as d3 from 'd3';

import dataloader from './modules/dataloader';
import Menu from './modules/menu';
import "./modules/dateHelper";

import createLineChart from "./timeseriesHandler";
import createBarChart from "./barchartHandler";
import createArcDiagram from "./arcDiagram";

import 'bootstrap/dist/css/bootstrap.css';
import './style.css';

const crossfilter = require('crossfilter');
function copyToClipboard(text) {
  window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
}

var urlParams;
(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
})();

//-----------------
// TIMELINE
const timeline = {};
timeline.svg = d3.select("#timeline-svg")
    .attr("width", function() { return this.parentNode.clientWidth; })
    .attr("height", window.innerHeight/3);
timeline.margin = { left: 50, top: 50, right: 50, bottom: 50 };
timeline.canvas = { width: timeline.svg.attr("width")-timeline.margin.left-timeline.margin.right, height: timeline.svg.attr("height")-timeline.margin.top-timeline.margin.bottom };
timeline.plot = timeline.svg.append("g").attr("transform", `translate(${timeline.margin.left},${timeline.margin.top})`);
//-----------------
// GENDER BREAKDOWN
const gender = {};
gender.svg = d3.select("#gender-svg")
    .attr("width", function() { return this.parentNode.clientWidth; })
    .attr("height", window.innerHeight/4);
gender.margin = {left: 50, top: 50, right: 50, bottom: 50};
gender.canvas = { width: gender.svg.attr("width")-gender.margin.left-gender.margin.right, height: gender.svg.attr("height")-gender.margin.top-gender.margin.bottom };
gender.plot = gender.svg.append("g").attr("transform", `translate(${gender.margin.left},${gender.margin.top})`);
const age = {};
age.svg = d3.select("#age-svg")
    .attr("width", function() { return this.parentNode.clientWidth; })
    .attr("height", gender.svg.attr("height")*5/3.4);
age.margin = {left: 55, top: 50, right: 50, bottom: 50};
age.canvas = { width: age.svg.attr("width")-age.margin.left-age.margin.right, height: age.svg.attr("height")-age.margin.top-age.margin.bottom };
age.plot = age.svg.append("g").attr("transform", `translate(${age.margin.left},${age.margin.top})`);
const municipality = {};
municipality.svg = d3.select("#municipality-svg")
    .attr("width", function() { return this.parentNode.clientWidth; })
    .attr("height", window.innerHeight/2);
municipality.margin = {left: 50, top: 50, right: 50, bottom: 50};
municipality.canvas = { width: municipality.svg.attr("width")-municipality.margin.left-municipality.margin.right, height: municipality.svg.attr("height")-municipality.margin.top-municipality.margin.bottom };
municipality.plot = municipality.svg.append("g").attr("transform", `translate(${municipality.margin.left},${municipality.margin.top})`);

let tripsCf, municipalitySet = d3.set(), bikeIdsArray, stationDetailsMap = {};
let bikeDimension;
//Load data
//Once loaded, populate all modules
dataloader
	.on('dataloaded',function(data){
		//Once dataloaded, populate modules
        data[0].forEach(d=>{
            municipalitySet.add(d.municipality);
            stationDetailsMap[d.id] = d;
        });
        bikeIdsArray = data[1];

        if (urlParams.bikeid) {
            dataloader.loadJson("./processedData/bike_"+urlParams.bikeid+"_2016.json");
            d3.select("#share")
                .on("click", function() {
                    copyToClipboard(window.location.href)
                });
        } else {
            const selectedBikeId = selectRandomBike();
            d3.select("#share")
                .on("click", function() {
                    copyToClipboard(window.location.href+"?bikeid="+selectedBikeId)
                });
            dataloader.loadJson("./processedData/bike_"+selectedBikeId+"_2016.json");
        }
	});

function selectRandomBike() {
    const index = parseInt(Math.random() * bikeIdsArray.length);
    const selectedBikeId = bikeIdsArray[index];
    return selectedBikeId;
}

//seq_id,hubway_id,status,duration,start_date,strt_statn,end_date,end_statn,bike_nr,subsc_type,zip_code,birth_date,gender
const tripsParse = function(d, i) {
    return {
        duration: d.tripduration,
        startDate: new Date(d.starttime),
        endDate: new Date(d.stoptime),
        startStation: +d["start station id"],
        endStation: +d["end station id"],
        bikeId: d.bikeid,
        userType: d.usertype,
        birthYear: d["birth year"] == "\N" && +d["birth year"] ? undefined : +d["birth year"],
        gender: +d.gender === 0 ? "Unknown" : (+d.gender == 1 ? "Female" : "Male")
    };
};

dataloader.on("dataloadedjson", function(trips) {
    d3.select("#total-trips").text(trips.length);
    trips = trips.map(tripsParse);
    trips.forEach(d => {
        if (!stationDetailsMap[d.startStation] || !stationDetailsMap[d.endStation]) {
            return;
        }
        d.startMunicipality = stationDetailsMap[d.startStation].municipality;
        d.endMunicipality = stationDetailsMap[d.endStation].municipality;
    });

    trips = trips.filter(d=>d.startMunicipality && d.endMunicipality);
    tripsCf = crossfilter(trips);

    const lineChartModule = createLineChart(trips, timeline.plot, timeline.canvas);
    lineChartModule();

    const ageCategorisationFn = d=>{
        if (d.birthYear) {
            const diff = parseInt(2017-d.birthYear);
            if (diff < 18) {
                return "0-17";
            } else if (diff < 26) {
                return "18-25";
            } else if (diff < 41) {
                return "26-40";
            } else if (diff <= 65) {
                return "41-65";
            } else {
                return "65+";
            }
        }
        return "Unknown";
    };
    const ageChart = createBarChart(trips, age.plot, age.canvas, ageCategorisationFn);
    const genderChart = createBarChart(trips, gender.plot, gender.canvas);
    const scaleX = d3.scaleLinear()
        .domain([0, d3.max([ageChart.maxValue(), genderChart.maxValue()])]);
    const ageScaleY = d3.scaleBand().domain(["0-17", "18-25", "26-40", "41-65", "65+", "Unknown"]);
    genderChart.scaleX(scaleX)();
    ageChart.scaleX(scaleX).scaleY(ageScaleY)();

    const yAxisBtns = d3.select("#timeseries-y-axis");
    yAxisBtns.selectAll("button")
        .on("click", function(){
            yAxisBtns.selectAll("button").classed("active", false);
            d3.select(this).classed("active", true);
            const scaleX = d3.scaleLinear()
                .domain([0, d3.max([ageChart.maxValue(this.dataset.key), genderChart.maxValue(this.dataset.key)])]);
            const ageScaleY = d3.scaleBand().domain(["0-17", "18-25", "26-40", "41-65", "65+", "Unknown"]);
            genderChart.scaleX(scaleX);
            ageChart.scaleX(scaleX).scaleY(ageScaleY);
            setTimeout(lineChartModule, 0, this.dataset.key);
            setTimeout(ageChart, 0, this.dataset.key);
            setTimeout(genderChart, 0, this.dataset.key);
        });

    const municipalityChart = createArcDiagram(trips, municipality.plot, municipality.canvas, stationDetailsMap);
    municipalityChart();
});
