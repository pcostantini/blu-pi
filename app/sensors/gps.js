var _ = require('lodash');
var Rx = require('rx');
var Bancroft = require('bancroft');

var SensorName = 'Gps';

function GPS() {
  return Rx.Observable.create(function (observer) {

    var bancroft = new Bancroft();
    bancroft.on('location', function (location) {

      if(isNaN(location.timestamp)) {
        return observer.onNext({ name: SensorName, value: null });
      }
      
      // remove ...      geometries: { type: 'Point', coordinates: [Object] }
      var cleanLocation = _.omit(location, ['geometries']);
      if(location.geometries && location.geometries.coordinates) {
        cleanLocation.point = location.geometries.coordinates;
      }

      observer.onNext({ name: SensorName, value: cleanLocation });
    });

  });
}

module.exports = GPS;
