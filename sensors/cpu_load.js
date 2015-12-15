var Rx = require('rx');
var os = require('os');

function CpuLoad() {
  'use strict';

  return Rx.Observable.create(function (observer) {

  	function readAndEmit() {
      observer.onNext({ name: 'CpuLoad', value: os.loadavg() });
    }

    setInterval(readAndEmit, 5000);
    readAndEmit();

  });
}

module.exports = CpuLoad;