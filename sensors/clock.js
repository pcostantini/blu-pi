var Rx = require('rx');

function Clock() {
  return Rx.Observable.create(function (observer) {

    var lastValue = null;
    function readAndEmit() {
      var value = new Date();
      if(lastValue !== value) {
        lastValue = value;
        observer.onNext({ name: 'Clock', value: value });
      }
    }
    
    setInterval(readAndEmit, 100);
    readAndEmit();

  });
}

module.exports = Clock;