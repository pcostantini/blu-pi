var _ = require('lodash');
var minimist = require('minimist');
var Rx = require('rx');
// for debugging leaks
// // require('heapdump'); 

var argv = minimist(process.argv.slice(2));

// init
var sessionId = new Date().getTime();
var demoMode = argv.demo || argv.d;
var webDisplay = argv.webDisplay || argv.wd;
var config = {
  persist: !demoMode,
  persistBuffer: 0,
  sessionId: sessionId,
  dbFile: !demoMode
    ? 'sensors-' + sessionId + '.sqlite3'
    : './data/sensors-1456895867978-TestRideParqueSarmiento.sqlite3',
  sensors: {
    // refresh times
    lsm303: {
      acceleration: 1000,
      axes: 1000,
      heading: 1000,
      temp: 5000
    },
    temperature: 5000
  },
  displayDriver: !webDisplay
    ? require('./display/drivers/oled')
    : require('./display/drivers/web')
};

console.log('blu-pi!', config);

// global error handling
// this is due to some sensor code may throw error in async ways, not making it possible to catch
process.on('uncaughtException', (err) => {
  console.log('ERROR!: ', err.toString());
  console.log('ERROR.....', err.stack);
});


// inputs
// var inputs = require('./inputs');
var inputs = Rx.Observable.empty();
inputs.subscribe(console.log);

// sensors
var sensors = !demoMode
  ? require('./bootstrap_sensors')(config.sensors)
  : require('./replay_sensors')(config.dbFile);

var db;
if(config.persist) {

  var useBufferedPersistence = config.persistBuffer > 0;
  var persistence = useBufferedPersistence
    ? require('../persistence/session_buffered') 
    : require('../persistence/session');

  db = useBufferedPersistence
    ? persistence.OpenDb(config.dbFile, config.persistBuffer)
    : persistence.OpenDb(config.dbFile);

  // persist with timestamp
  sensors
    .select(function(sensorEvent) {
      return _.extend(
        { timestamp: new Date().getTime() },
        sensorEvent);
    })
    .subscribe(db.insert);
}

// var screens = [
//   'screensaver', // dummy stuff
//   'ticks',       // time and distance
//   'speed',       // current speed values (gps, odometer, cadence)
//   'intervals',
// ];

var ticks = require('./sensors/ticks')();
var all = Rx.Observable.merge(ticks, sensors, inputs);
all.subscribe(console.log)

// DISPLAY
var Driver = config.displayDriver;
var GFX = require('edison-ssd1306/src/Adafruit_GFX');
var width = 128;
var height = 64;
var driver = _.extend(
  new GFX(height, width),     // invert size since oled is rotated
  new Driver(width, height));

var ScreenSaverDisplay = require('./display/screensaver');
var ui = ScreenSaverDisplay(driver, all);

// web server + api
// var server = require('../server')(db);

// GC COLLECTION - TODO: REVIEW IS REALLY NEEDED
var gcWaitTime = 60000; // 1'
(function gc() {
  if (global.gc) {
    console.log('...GC!');
    global.gc();
    setTimeout(gc, gcWaitTime);
  } else {
    console.log('Garbage collection unavailable.  Pass --expose-gc '
      + 'when launching node to enable forced garbage collection.');
  }
})();


