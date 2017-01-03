var Rx = require('rxjs');
var hotswap = require('hotswap');

var SensorsBootstrap = require('./bootstrap_sensors');
var ReplaySensors = require('./replay_sensors');
var Persistence  = require('../persistence');
var Display = require('./display');
var StateReducer = require('./state');
var Ticks = require('./sensors/ticks');

// init
var config = require('./config');
console.log('blu-pi!', config);

var input = config.inputDriver()
				  .map((s) => ({ name: s.name, value: Date.now() }));

// input.subscribe(console.log);

// sensors
var sensors = !config.demoMode
  ? SensorsBootstrap(config.sensors)
  : ReplaySensors(config.dbFile, config.demoScheduled);

// save
if(config.persist) {
  var db = Persistence(config.dbFile);
  sensors.subscribe(db.insert);
}

// clock & ticks
var clock = sensors.filter(s => s.name === 'Clock');
var ticks = Ticks(clock);

var all = Rx.Observable.merge(input, sensors, ticks)
var state = StateReducer.FromStream(
  inputs,
  [
    PathReducer(gpsEvents),
    DistanceReducer(gpsEvents)
  ]);

// TODO: read from console and on key was toggled, do console.log
if(config.logState) {
  state
    .throttle(ev => Rx.Observable.interval(1000))
    .subscribe(console.log);
}

// allPlusState
var allPlusState = Rx.Observable.merge(input, sensors, ticks, state);

// state store // TODO: dump?
var stateStored = null;
allPlusState.filter((s) => s.name === 'State')
   .subscribe((s) => stateStored = s.value);

var stateStore = {
	getState: () => stateStored
};

// DISPLAY
var ui = Display(config.displayDriver, allPlusState, stateStore);

// web server + api
// var server = require('../server')(db);
// ...

