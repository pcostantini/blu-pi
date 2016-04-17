var _ = require('lodash');
var Rx = require('rx');
// for debugging leaks
// // require('heapdump'); 

// init
var config = require('./config');

console.log('blu-pi!', config);

// sensors
var sensors = !config.demoMode
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

  // persist with timestamp, using Gps.timestamp as clock
  var lastTs = {
    cpu: new Date().getTime(),
    gps: new Date().getTime()
  };
  const getTimestamp = () => lastTs.gps + (new Date().getTime() - lastTs.cpu);
  var timestamp = sensors.filter(s => s.name === 'Gps' && s.value && s.value.timestamp)
                         .select(s => ({ name: 'Ts', value: s.value.timestamp}))
                         .do((s) => lastTs = {
                            cpu: new Date().getTime(),
                            gps: s.value
                          }).subscribe();
  sensors
    .select(s => _.extend({ timestamp: getTimestamp() }, s))
    .subscribe(db.insert);
}

// TODO:
// var stateStream = require('./state').CreateFromEventStream(events);

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
var inputs = config.inputDriver().share();
var all = Rx.Observable.merge(ticks, inputs, sensors).share();
var all = Rx.Observable.merge(ticks, sensors, inputs).share();
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