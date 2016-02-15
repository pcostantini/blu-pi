var _ = require('underscore');
var Rx = require('rx');
var Bancroft = require('bancroft');

var SensorName = 'Gps';

function GPS() {
  return Rx.Observable.create(function (observer) {
    var bancroft = new Bancroft();

    bancroft.on('location', function (location) {
      
      // remove ...      geometries: { type: 'Point', coordinates: [Object] }
      var cleanLocation = _.omit(location, ['geometries']);
      if(location.geometries && location.geometries.coordinates) {
        cleanLocation.point = location.geometries.coordinates;
      }

      observer.onNext({ name: SensorName, value: cleanLocation });
      
    });
    
    //// bancroft.on('satellite', function (satellite) {
    ////   console.log('GPS:satellite located!', satellite);
    //// });

  });
}

function traceError(e) {
  console.log('grps.err!', e);
}

module.exports = GPS;
