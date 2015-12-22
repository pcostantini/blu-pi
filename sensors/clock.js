var Rx = require('rx');

function Clock() {
  return Rx.Observable.create(function (observer) {

    function readAndEmit() {
      var e = { name: 'Clock', value: new Date() };
      observer.onNext(e);
    }
    
    setInterval(readAndEmit, 1000);
    readAndEmit();

  });
}

module.exports = Clock;