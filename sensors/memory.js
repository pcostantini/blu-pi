var _ = require('lodash');
var Rx = require('rx');
var os = require('os');

var SensorName = 'Memory';

function Memory() {
  return Rx.Observable.create(function (observer) {

    function readAndEmit() {
    	var value = process.memoryUsage();
    	value.freeMem = os.freemem();
        observer.onNext({ name: SensorName, value: value });
    }

    setInterval(readAndEmit, 3000);
    readAndEmit();

  });    
}

module.exports = Memory;
