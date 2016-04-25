var Persistence = require('../persistence');
var _ = require('lodash');

var dbFilePath = process.argv[2];
if(!dbFilePath) throw new Error('no path to .sqlite!');

// load path
var db = Persistence(dbFilePath, true);
var pathDone = db
  .readSensors()
  .then(evts => evts.filter(isGps)
                    .map(asTrackEvent)
                    .filter(e => !!e.data)
                    .map(getCoordinate));

// inputs
var inputs = require('../app/inputs')();
inputs.subscribe(console.log);

// ui
var Driver = require('../app/display/drivers/oled');
var GFX = require('edison-ssd1306/src/Adafruit_GFX');
var width = 128;
var height = 64;
var driver = _.extend(
  new GFX(height, width),     // invert size since oled is rotated
  new Driver(width, height));


pathDone.then(path => {
  try {
    var state = {
      gpsPath: path
    };
    var Display = require('../app/display/map');
    var ui = new Display(driver, inputs, state);
inputs.subscribe(() => ui.cycle());
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

const getCoordinate = (s) => ([s.data.latitude, s.data.longitude]);
