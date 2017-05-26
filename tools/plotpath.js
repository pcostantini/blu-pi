var Persistence = require('../app/persistence');
var Promise = require('bluebird');
var _ = require('lodash');

var filePath = process.argv[2];
if(!filePath) throw new Error('no path to .sqlite or .gpx!');

// inputs
var inputs = require('../app/inputs_console')();
// var inputs = require('../app/inputs_gpio')();
inputs.subscribe(console.log);

// ui
// var Driver = require('../app/display/drivers/oled');
var Driver = require('../app/display/drivers/web');
var GFX = require('../app/display/adafruit-gfx');
var width = 128;
var height = 64;
var driver = _.extend(
  new GFX(height, width),     // invert size since oled is rotated
  new Driver(width, height));

// read
var gpsEvents;
if(_.last(filePath.toLowerCase().split('.')) === 'gpx') {
  // load path from GPX
  var GpxParse = require("gpx-parse");
  var readGpx = Promise.promisify(GpxParse.parseGpxFromFile);
  var gpsPoints = readGpx(filePath)
    .then((o) => o.tracks[0].segments[0]
                  .map((waypoint) => [waypoint.lat, waypoint.lon, waypoint.elevation]));
  gpsEvents = Rx.Observable.from(gpsPoints);
} else {
  // load path from Db
  var db = new Persistence(filePath, true);
  var sensors = db.readSensors();
  sensors.count().subscribe(cnt => console.log('sensors.count()', cnt));
  gpsEvents = sensors
    .filter(isGps)
    .do(console.log)
    .map(asTrackEvent)
    .do(console.log)
    .filter(e => !!e.data)
    .map(getCoordinate)
    .do(console.log)
}

gpsEvents.count().subscribe(cnt => console.log('gpsEvents.count()', cnt));

var path = PathReducer(gpsEvents);
path.last()
  .do(console.log)
  .subscribe((s) => {
    var path = s.value.points;
    try {
      console.log('path.points: ' + path.length);
      var stateStore = {
        getState: () => ({ Path: { points: path } })
      };
      var Display = require('../app/display/map');
      var ui = new Display(driver, inputs, stateStore);

      inputs.filter((e) => e.name === 'Input:Next')
        .subscribe(() => ui.cycle());

      console.log('ready!');

    } catch (err) {
      console.log('INIT.ERR!', {
        err: err,
        stack: err.stack
      });
    }
});

// helpers
function isGps(s) {
  return s.sensor === 'Gps' && !!s.data;
}

function asTrackEvent(s) {
  return {
    timestamp: s.timestamp,
    sensor: s.sensor,
    data: JSON.parse(s.data)
  };
}

function getCoordinate(s) {
  return [s.data.latitude, s.data.longitude, s.data.altitude];
}

function PathReducer (gpsEvents) {
  return gpsEvents
    .do(console.log)
    .map(gps => [gps.latitude, gps.longitude])
    .filter(point => point[0] && point[1] &&
                     (lastPoint[0] !== point[0] ||
                      lastPoint[1] !== point[1]))
    .scan((path, point) => {
      lastPoint = point;
      path.push(point);
      return path;
    }, [])
    .map((path) => ({
      name: 'Path',
      value: { length: path.length, points: path }
    }));
}