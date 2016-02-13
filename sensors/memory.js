var _ = require('lodash');
var Rx = require('rx');
var os = require('os');

var SensorName = 'Memory';

function Memory() {
  return Rx.Observable.create(function (observer) {

    function readAndEmit() {
    	var value = process.memoryUsage();
    	value.freeMem = os.freemem();
        var e = { name: SensorName, value: value };
        observer.onNext(e);
    }

    setInterval(readAndEmit, 5000);
    readAndEmit();

  });    
}

module.exports = Memory;
