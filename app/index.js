var _ = require('lodash');
var minimist = require('minimist');
var Rx = require('rx');
// for debugging leaks
// // require('heapdump'); 

// init
var sessionId = new Date().getTime();
var argv = minimist(process.argv.slice(2));
var demoMode = argv.demo || argv.d;
var webDisplay = argv.webDisplay || argv.wd;
var consoleInput = argv.console || argv.c;

var config = {
  persist: !demoMode,
  persistBuffer: 0,
  sessionId: sessionId,
  dbFile: !demoMode
    ? 'sensors-' + sessionId + '.sqlite3'
    : 'sensors-1456895867978-TestRideParqueSarmiento.sqlite3',
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
    : require('./display/drivers/web'),
  inputDriver: !consoleInput
    ? require('./inputs')
    : require('./inputs_console')
};

console.log('blu-pi!', config);

// global error handling
// this is due to some sensor code may throw error in async ways, not making it possible to catch
process.on('uncaughtException', (err) => {
  console.log('ERROR!: ', {
    err: err.toString(),
    stack: err.stack
  });
});

// sensors
var sensors = !demoMode
  ? require('./bootstrap_sensors')(config.sensors)
  : require('./replay_sensors')(config.dbFile);

// persist
if(config.persist) {
  var useBufferedPersistence = config.persistBuffer > 0;
  var persistence = useBufferedPersistence
    ? require('../persistence/session_buffered') 
    : require('../persistence/session');

  var db = useBufferedPersistence
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

// state
var state = {
  distance: 0,
  gpsPath: []
};

// take gps events and calculate distance
var GpsDistance = require('gps-distance');
var GpsNoiseFilter = require('./gps_noise_filter');
sensors
  .filter(s => s.name === 'Gps')
  .select(s => s.value)
  .filter(GpsNoiseFilter(GpsNoiseFilter.DefaultSpeedThreshold))
  .select(gps => [gps.latitude, gps.longitude])
  .scan((last, curr) => {
    if(last) {
      var offset = GpsDistance(last[0], last[1],
                               curr[0], curr[1]);

      console.log('offset', offset)
      state.distance += offset;
    }
    return curr;
  }, null)
  .subscribe();

// take gps events and accumulate path points
sensors
  .filter(s => s.name === 'Gps' && s.value && s.value.latitude)
  .select(s => [s.value.latitude, s.value.longitude])
  .scan((path, point) => {
    path.push(point);
    return path;
  }, state.gpsPath)
  .subscribe();

// inputs & ticks
var ticks = require('./sensors/ticks')();
var inputs = config.inputDriver();
inputs.subscribe(console.log);
var all = Rx.Observable.merge(ticks, sensors, inputs);
// all.subscribe(console.log)  

// DISPLAY
var Driver = config.displayDriver;
var GFX = require('edison-ssd1306/src/Adafruit_GFX');
var width = 128;
var height = 64;
var driver = _.extend(
  new GFX(height, width),     // invert size since oled is rotated
  new Driver(width, height));

var Display = require('./display');
var ui = Display(driver, all, state);

// web server + api
// var server = require('../server')(db);

// GC COLLECTION - TODO: REVIEW IF REALLY NEEDED
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


