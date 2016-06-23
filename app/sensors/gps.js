var _ = require('lodash');
var Rx = require('rxjs');
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

      observer.next({ name: SensorName, value: cleanLocation });
    });

  }).share();
}

module.exports = GPS;
