/*jshint esversion: 6*/
const d3 = require('d3');

const crossfilter = require("crossfilter");

d3.queue()
    .defer(d3.csv, "http://localhost:9000/data/201601-hubway-tripdata.csv")
    .defer(d3.csv, "http://localhost:9000/data/201602-hubway-tripdata.csv")
    .defer(d3.csv, "http://localhost:9000/data/201603-hubway-tripdata.csv")
    .defer(d3.csv, "http://localhost:9000/data/201604-hubway-tripdata.csv")
    .defer(d3.csv, "http://localhost:9000/data/201605-hubway-tripdata.csv")
    .defer(d3.csv, "http://localhost:9000/data/201606-hubway-tripdata.csv")
    .defer(d3.csv, "http://localhost:9000/data/201607-hubway-tripdata.csv")
    .defer(d3.csv, "http://localhost:9000/data/201608-hubway-tripdata.csv")
    .defer(d3.csv, "http://localhost:9000/data/201609-hubway-tripdata.csv")
    .defer(d3.csv, "http://localhost:9000/data/201610-hubway-tripdata.csv")
    .defer(d3.csv, "http://localhost:9000/data/201611-hubway-tripdata.csv")
    .defer(d3.csv, "http://localhost:9000/data/201612-hubway-tripdata.csv")
    .awaitAll(function(err, data) {
        const masterData = data[0].concat(data[1])
            .concat(data[2])
            .concat(data[3])
            .concat(data[4])
            .concat(data[5])
            .concat(data[6])
            .concat(data[7])
            .concat(data[8])
            .concat(data[9])
            .concat(data[10])
            .concat(data[11]);
        const bikeIdSet = new Set();
        masterData.forEach(d=>{
            bikeIdSet.add(d.bikeid);
        });

        const cf = crossfilter(masterData);
        const bikeIdDimension = cf.dimension(d=>d.bikeid);
        bikeIdsArray = [];
        bikeIdSet.forEach(bikeid => {
            bikeIdsArray.push(bikeid);
        });
        writeJsonFile(bikeIdsArray, "dist/processedData/bikeIds.json", () => {
            setTimeout(filterAndSave, 0, cf, bikeIdDimension, 0, bikeIdsArray);
        });
    });

function filterAndSave(cf, dimension, index, filterArray) {
    if (index >= filterArray.length) {
        return;
    }
    console.log(index);
    dimension.filter(filterArray[index]);
    const data = dimension.top(Infinity);
    index++;
    writeJsonFile(data, "dist/processedData/bike_"+filterArray[index]+"_2016.json", () => {
        setTimeout(filterAndSave, 0, cf, dimension, index, filterArray);
    });
}

const fs = require("fs");
function writeJsonFile(data, filename, callback) {
    fs.writeFile(filename, JSON.stringify(data), function(err){
        if(err) throw err;
        callback();
    });
}
