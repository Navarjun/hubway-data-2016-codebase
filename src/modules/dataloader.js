/*jshint esversion: 6*/
import {csv,json,dispatch,queue} from 'd3';

function Dataloader(){
	const _dis = dispatch('dataloaded','dataloaderror', "dataloadedjson", "dataloadedcsv");

	function exports(){
	}

	exports.loadCsv = function(url,parse,successEvent="dataloadedcsv", errorEvent="dataloaderror"){
		csv(url,parse,function(err,data){
			if(err){
				_dis.call(errorEvent,null,err);
			}else{
				_dis.call(successEvent,null,data);
			}
		});
		return this;
	};

    exports.loadJson = function(url,successEvent="dataloadedjson", errorEvent="dataloaderror"){
		json(url,function(err,data){
			if(err){
				_dis.call(errorEvent,null,err);
			}else{
				_dis.call(successEvent,null,data);
			}
		});
		return this;
	};

    exports.queue = function(urls, queueFns, parseFns) {

        const queueObj = queue();
        urls.forEach((url, i) => {
            if (queueFns[i] == json) {
                queueObj.defer(queueFns[i], url);
            } else{
                queueObj.defer(queueFns[i], url, parseFns[i]);
            }
        });
        queueObj.awaitAll(function(err, data) {
            if(err){
                _dis.call('dataloaderror',null,err);
            }else{
                _dis.call('dataloaded',null,data);
            }
        });
    };

	exports.on = function(){
		_dis.on.apply(_dis,arguments);
		return this;
	};

	return exports;
}

const dataloader = Dataloader(); //dataloader == exports

function stationsParse(d, i) {
    return {
        id: i,
        terminal: d["Station ID"],
        municipality: d.Municipality,
        name: d.Station,
        lat: d.Latitude,
        lon: d.Longitude,
        docks: d["# of Docks"]
    };
}


dataloader.queue(["./data/Hubway_Stations_2011_2016.csv", "./processedData/bikeIds.json"], [csv, json], [stationsParse, null]);

export default dataloader; //What did we export?
