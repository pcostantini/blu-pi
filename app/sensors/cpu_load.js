var Rx = require('rxjs');
var os = require('os');

function CpuLoad(delay) {

  return Rx.Observable.create(function (observer) {

  	function readAndEmit() {
    	observer.next({ name: 'CpuLoad', value: os.loadavg() });
    }

    setInterval(readAndEmit, delay || 3000);
    readAndEmit();

  });
}

module.exports = CpuLoad;