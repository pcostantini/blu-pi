var Rx = require('rx');
var temp = require("pi-temperature");

function CpuTemperature() {
  'use strict';
  return Rx.Observable.create(function (observer) {

    var lastTemp;
    function readAndEmit() {
      // TODO: try/catch
      temp.measure(function (value)
      {
        if(lastTemp === value)
        {
          return;
        }

        lastTemp = value;
        observer.onNext({ name: 'CpuTemperature', value: value });

      });
    }
    
    setInterval(readAndEmit, 1000);
    readAndEmit();

  });
}

module.exports = CpuTemperature;