var Rx = require('rxjs');
var _ = require('lodash');
var Persistence = require('../app/persistence');
var Gpx = require('./gpx');
var xml2json = require('xml2json');
var path = require('path');

// input arguments:
// [0] = .sqlite file
// [1] = activity name [optional]

var dbFilePath = process.argv[2];
if(!dbFilePath) {
  dbFilePath = './data/current.sqlite3'
}
// if (!dbFilePath) throw new Error('no path to .sqlite!');

var activityName = process.argv[3];
if (!activityName) {
  activityName = path.basename(dbFilePath).split('.')[0]; // remove .ext
}

// read
var db = new Persistence(dbFilePath, true);
var events = db.readSensors();
var track = events.filter(is('Gps')).map(asPoint);
var temp = events.filter(is('Barometer')).map(asTemp);

var all = Rx.Observable.merge(track, temp);
var allPointsSeed = { points: [], lastTemperature: null };
var allPoints = all.scan((ac, item) => {
  if (item.ts && item.lat !== undefined) {
    ac.points.push(
      _.extend({ temp: ac.lastTemperature }, item));
  }

  if (item.temp !== undefined) {
    ac.lastTemperature = item.temp;
  }

  return ac;
}, allPointsSeed);

allPoints.last().subscribe(result => {
  var points = result.points;
  var gpx = Gpx.asGpxObject(points, activityName);
  // var json = JSON.stringify(gpx, null, '\t');
  var xml = xml2json.toXml(gpx);

  console.log(xml);

});




// helpers
function is(sensorName) {
  return function (s) {
    return s.name === sensorName && !!s.value;
  }
}

function asPoint(s) {
  return {
    ts: s.value.timestamp,
    lat: s.value.latitude,
    lon: s.value.longitude,
    el: s.value.altitude
  };
}

function asTemp(s) {
  return {
    ts: s.timestamp,
    temp: s.value.temperature,
    pres: s.value.pressure
  };
}
