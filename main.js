var _ = require('underscore');
var Rx = require('rx');
require('heapdump'); // FOR MEMORY ANALYSIS PURPOSES

// config
var sessionId = new Date().getTime();
var config = {
  persist: false,
  persistBuffer: 30,
  sessionId: sessionId,
  dbFile: './sensors-' + sessionId + '.sqlite3',
  sensors: {
    // refresh times
    lsm303: {
      acceleration: 1000,
      axes: 1000,
      heading: 1000,
      temp: 1000
    }
  }
};

// inputs
var gpio = require('./gpios');
var inputBack = gpio.readPin(18, 0).select(as(-1));
var inputNext = gpio.readPin(27, 0).select(as( 0));
// var inputOk = gpio.readPin(25, 0).select(as(1));
var inputs = Rx.Observable.merge(
  [ inputBack, inputNext/*, inputOk*/ ]);
inputs.subscribe(console.log);

// ODOMTER & CADENCE
// ...
// var wheelLoop = gpio.readPin(24, 0).select(as(1));
// wheelLoop.subscribe(() => console.log('...weeeee!'));

// sensors
var sensors = require('./bootstrap_sensors')(config.sensors);

if(config.persist) {

  var persistence = require('./session_persistence');
  var db = persistence.OpenDb(config.dbFile, config.persistBuffer);

  // persist with timestamp
  sensors
    .select(function(sensorEvent) {
      return _.extend(
        { timestamp: new Date().getTime() },
        sensorEvent);
    })
    .subscribe(db.insert);
}

// ticks
var ticks = require('./sensors/ticks')();

// convert sensor data to state
var state = Rx.Observable.merge(
  ticks, sensors)
  .scan(function(currentState, sensor) {
    currentState[sensor.name] = sensor.value;
    return currentState;
  }, {})
  .throttle(5000);

state.subscribe(console.log);

// var screens = [
//   'screensaver', // dummy stuff
//   'ticks',       // time and distance
//   'speed',       // current speed values (gps, odometer, cadence)
//   'intervals',
// ];

// menu
var Display = require('./display');

// axis
// var Display = require('./display/axis');

// ...
var ui = Display(sensors, state);
// ui?


// REPL support
// initRepl(app);
// function initRepl(app) {
//   var replify = require('replify');
//   replify('pi-blu', app);
//   console.log('REPL READY!: nc -U /tmp/repl/pi-blu.sock');
// }

// GC COLLECTION - TODO: REVIEW IS REALLY NEEDED
var gcWaitTime = 60000; // 1'
(function gc() {
  if (global.gc) {
    console.log('GC...');
    global.gc();
    setTimeout(gc, gcWaitTime);
  } else {
    console.log('Garbage collection unavailable.  Pass --expose-gc '
      + 'when launching node to enable forced garbage collection.');
  }
})();



// ...
function as(inputValue) {
  return function(e) {
    return {
      input: inputValue
    };
  };
}
