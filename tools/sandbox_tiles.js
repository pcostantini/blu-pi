var Persistence = require('../app/persistence');
var _ = require('lodash');
var pngtolcd = require('png-to-lcd');


// var dbFilePath = process.argv[2];
// if(!dbFilePath) throw new Error('no path to .sqlite!');

// // load path
// var db = new Persistence(dbFilePath, true);
// var pathDone = db
//   .readSensors()
//   .then(evts => evts.filter(isGps)
//                     .map(asTrackEvent)
//                     .filter(e => !!e.data)
//                     .map(getCoordinate));
Buffer.prototype.toByteArray = function () {
  return Array.prototype.slice.call(this, 0)
}

pngtolcd('./data/tiles/9869.png', false, function(err, buffer) {
  if(err) {
    console.log(err)
    return;
  }

  buffer = buffer.toByteArray();
  driver.setBuffer(buffer);
  driver.display();
  console.log("display!");
});

// inputs
var inputs = require('../app/inputs_console')();
inputs.subscribe(console.log);

// ui
var Driver = require('../app/display/drivers/oled');
// var Driver = require('../app/display/drivers/web');
var GFX = require('../app/display/adafruit-gfx');
var width = 128;
var height = 64;
var driver = _.extend(
  new GFX(height, width),     // invert size since oled is rotated
  new Driver(width, height));


// pathDone.then(path => {
//   try {
//     var state = {
//       gpsPath: path
//     };
//     var Display = require('../app/display/map');
//     var ui = Display(driver, inputs, state);
//   } catch(err) {
//     console.log('INIT.ERR!', {
//       err: err,
//       stack: err.stack
//     });
//   }
// });

// helpers
const isGps = (s) => s.sensor === 'Gps' && !!s.data;

const asTrackEvent = (s) => ({
    timestamp: s.timestamp,
    sensor: s.sensor,
    data: JSON.parse(s.data)
  });

const getCoordinate = (s) => ([s.data.latitude, s.data.longitude]);

