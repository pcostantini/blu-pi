var Rx = require('rxjs');
var os = require('os');

function CpuLoad() {

  return Rx.Observable.create(function (observer) {

  	function readAndEmit() {
    	observer.next({ name: 'CpuLoad', value: os.loadavg() });
    }

    setInterval(readAndEmit, 3000);
    readAndEmit();

  });
}

module.exports = CpuLoad;