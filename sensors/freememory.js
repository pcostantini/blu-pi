var _ = require('lodash');
var Rx = require('rx');
var os = require('os');

function Memory() {
  return Rx.Observable.create(function (observer) {

    function readAndEmit() {
        var e = { name: 'FreeMemory', value: os.freemem() };
        observer.onNext(e);
    }

    setInterval(readAndEmit, 5000);
    readAndEmit();

  });    
}

module.exports = Memory;
