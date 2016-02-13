var Rx = require('rx');
var Bancroft = require('bancroft');

function GPS() {
  return Rx.Observable.create(function (observer) {
    var bancroft = new Bancroft();

    bancroft.on('location', function (location) {
      observer.onNext({ name: 'Gps', value: location });
    });
    
    bancroft.on('satellite', function (satellite) {
      console.log('GPS:satellite located!');
    });

  });
}

module.exports = GPS;