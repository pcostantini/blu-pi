var Rx = require('rx');

var SensorsBootstrap = require('./bootstrap_sensors');
var ReplaySensors = require('./replay_sensors');
var Persistence  = require('../persistence');
var Display = require('./display');

// init
var config = require('./config');
console.log('blu-pi!', config);

// sensors
var sensors = !config.demoMode
  ? SensorsBootstrap(config.sensors)
  : ReplaySensors(config.dbFile);

// persist
if(config.persist) {
  var db = Persistence(config.dbFile);
  sensors.subscribe(db.insert);
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
var ticks = require('./sensors/ticks')();
var inputs = config.inputDriver();
inputs.subscribe(console.log);

// all
var all = Rx.Observable.merge(inputs, sensors, ticks).share();


// DISPLAY
var ui = Display(config.displayDriver, all, state);

// web server + api
// var server = require('../server')(db);

// for debugging leaks
// require('heapdump'); 

