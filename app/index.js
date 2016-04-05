var _ = require('lodash');
var Rx = require('rx');
var GFX = require('edison-ssd1306/src/Adafruit_GFX');

// for debugging leaks
// // require('heapdump'); 

// init
var sessionId = new Date().getTime();
var config = {
  persist: true,
  persistBuffer: 0,
  sessionId: sessionId,
  dbFile: 'sensors-' + sessionId + '.sqlite3',
  sensors: {
    // refresh times
    lsm303: {
      acceleration: 1000,
      axes: 1000,
      heading: 1000,
      temp: 5000
    },
    temperature: 5000
  }
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
var sensors = require('./bootstrap_sensors')(config.sensors);
// var sensors = require('./replay_sensors')('sensors-1456895867978-TestRideParqueSarmiento.sqlite3');

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
// all.subscribe(console.log)

// var Driver = require('./display/web');  // MOCK
var Driver = require('./display/oled'); // OLED

var width = 128;
var height = 64;
var gfx = new GFX(height, width);  // invert size since oled is rotated
var driverImpl = new Driver(width, height);
var driver = _.extend(gfx, driverImpl);


var Display = require('./display');
var ui = Display(driver, all);

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


