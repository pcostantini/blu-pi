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

var input = config.inputDriver();

// sensors
var sensors = !config.demoMode
  ? SensorsBootstrap(config.sensors)
  : ReplaySensors(config.dbFile);

// save
if(config.persist) {
  var db = Persistence(config.dbFile);
  sensors.subscribe(db.insert);
}

// clock & ticks
var clock = sensors.filter(s => s.name === 'Clock');
var ticks = Ticks(clock);

// state
var inputsAndSensors = Rx.Observable.merge(input, sensors);
var state = StateReducer.FromStream(inputsAndSensors);
if(config.logState) {
  state
    .throttle(ev => Rx.Observable.interval(1000))
    .subscribe(console.log);
}

// all
var stateAndAll = Rx.Observable.merge(input, sensors, ticks, state)


// DISPLAY
var ui = Display(config.displayDriver, stateAndAll);

// web server + api
// var server = require('../server')(db);


// ...

