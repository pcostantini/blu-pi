var Rx = require('rx');
var Bancroft = require('bancroft');

var SensorName = 'Gps';

function GPS() {
  return Rx.Observable.create(function (observer) {
    var bancroft = new Bancroft();

    bancroft.on('location', function (location) {
      observer.onNext({ name: SensorName, value: location });
    });
    
    bancroft.on('satellite', function (satellite) {
      console.log('GPS:satellite located!', satellite);
    });

  });
}

module.exports = GPS;
