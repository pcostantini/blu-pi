var Rx = require('rx');
var os = require('os');

function CpuLoad() {
  'use strict';

  return Rx.Observable.create(function (observer) {

  	function readAndEmit() {
  		try {
      	observer.onNext({ name: 'CpuLoad', value: os.loadavg() });
      } catch(err) {
  		  console.log('cpu_load.read.err!', err);
      }
    }

    setInterval(readAndEmit, 3000);
    readAndEmit();

  });
}

module.exports = CpuLoad;