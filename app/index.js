var Rx = require('rxjs');

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
  .map(s => s.value)
  .filter(GpsNoiseFilter(GpsNoiseFilter.DefaultSpeedThreshold))
  .map(gps => [gps.latitude, gps.longitude])
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
  .map(s => [s.value.latitude, s.value.longitude])
  .scan((path, point) => {
    path.push(point);
    return path;
  }, state.gpsPath)
  .subscribe();

// inputs & ticks
var clock = sensors.filter(s => s.name === 'Clock');
var ticks = require('./sensors/ticks')(clock);
var inputs = config.inputDriver();
inputs.subscribe(console.log);

// all
var all = Rx.Observable.merge(inputs, sensors, ticks).share();
// all.subscribe(console.log);

// DISPLAY
var ui = Display(config.displayDriver, all, state);

// web server + api
// var server = require('../server')(db);

// for debugging leaks
// require('heapdump'); 

// REPL supportString::NewSymbol("write"),
initRepl(all);
function initRepl(app) {
  var replify = require('replify');
  replify('pi-blu', app);      
  console.log('REPL READY!: nc -U /tmp/repl/pi-blu.sock');
}


// ...