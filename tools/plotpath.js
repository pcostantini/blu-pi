var Persistence = require('../app/persistence');
var Promise = require('bluebird');
var _ = require('lodash');

var filePath = process.argv[2];
if(!filePath) throw new Error('no path to .sqlite or .gpx!');

var pathDone;

if(_.last(filePath.toLowerCase().split('.')) === 'gpx') {
  // load path from GPX
  var GpxParse = require("gpx-parse");
  var readGpx = Promise.promisify(GpxParse.parseGpxFromFile);
  pathDone = readGpx(filePath)
    .then((o) => o.tracks[0].segments[0]
                  .map((waypoint) => [waypoint.lat, waypoint.lon, waypoint.elevation]));
} else {
  // load path from Db
  var db = new Persistence(filePath, true);
  pathDone = db
    .readSensors()
    .then(evts => evts.filter(isGps)
                      .map(asTrackEvent)
                      .filter(e => !!e.data)
                      .map(getCoordinate));
}

// inputs
var inputs = require('../app/inputs_console')();
// var inputs = require('../app/inputs_gpio')();
inputs.subscribe(console.log);

// ui
//var Driver = require('../app/display/drivers/oled');
var Driver = require('../app/display/drivers/web');
var GFX = require('edison-ssd1306/src/Adafruit_GFX');
var width = 128;
var height = 64;
var driver = _.extend(
  new GFX(height, width),     // invert size since oled is rotated
  new Driver(width, height));


pathDone.then(path => {
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

  } catch(err) {
    console.log('INIT.ERR!', {
      err: err,
      stack: err.stack
    });
  }
});

// helpers
const isGps = (s) => s.sensor === 'Gps' && !!s.data;

const asTrackEvent = (s) => ({
    timestamp: s.timestamp,
    sensor: s.sensor,
    data: JSON.parse(s.data)
  });

const getCoordinate = (s) => ([s.data.latitude, s.data.longitude, s.data.altitude]);
