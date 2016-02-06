var _ = require('underscore');
var Rx = require('rx');

"use strict";

// init
var config = {
  dbFile: './sensors-' + new Date().getTime() + '.sqlite3'
};
console.log('starting pi-blu', config);
console.log('.');
var startTs = new Date().getTime();
function done() {
  var endTs = new Date().getTime();
  console.log('ready! took %d \'\'', (endTs - startTs) / 1000 );
}

// inputs
var gpio = require('./gpios');
var inputBack = gpio.readPin(18, 0).select(as(-1));
var inputNext = gpio.readPin(23, 0).select(as(0));
var inputOk = gpio.readPin(25, 0).select(as(1));
var inputs = Rx.Observable.merge(
  [ inputBack, inputNext, inputOk ]);
inputs.subscribe(console.log);

// ODOMTER & CADENCE
// ...
var wheelLoop = gpio.readPin(24, 0).select(as(1));
wheelLoop.subscribe(() => console.log('...weeeee!'));

// sensors
var bootstrap_sensors = require('./bootstrap_sensors');
var sensors = bootstrap_sensors();

// bufferedd persitence
var persistence = require('./session_persistence');
var bufferSize = 30;
var db = persistence.OpenDb(config.dbFile, bufferSize);

// persist with timestamp
sensors.select(function(sensorEvent) {
    return _.extend(
      { timestamp: new Date().getTime() },
      sensorEvent);
  }).subscribe(db.insert);

// ticks
var ticks = require('./sensors/ticks')();

// convert sensor data to kind of state
var state = Rx.Observable.merge(
  ticks, sensors)
  .scan(function(currentState, sensor) {
    currentState[sensor.name] = sensor.value;
    return currentState;
    // return _.extend(
    //   state,
    //   _.object([[sensor.name, sensor.value]]));
  }, {})
  .throttle(1000);

state.throttle(5000)
     .subscribe(console.log);

// var screens = [
//   'ticks',
//   'screensaver',
//   'speed',
//   'intervals',
// ];

// var Display = require('./display');
// var ui = Display(sensors, state);



// done
done();

// REPL support
// initRepl(app);
// function initRepl(app) {
//   var replify = require('replify');
//   replify('pi-blu', app);
//   console.log('REPL READY!: nc -U /tmp/repl/pi-blu.sock');
// }


// ...
function nameIn(names) {
  return function(s) {
    return names.indexOf(s.name) > -1;
  };
}

function echo(o) { console.log(o); return o; }

function getTime(date) {
  return date ? date.toLocaleTimeString().split(':').slice(0, -1).join(':') : '00:00';
}

function hasGpsFix(gps) {
  return !!gps && gps.mode > 1
}

function getTemp(barometer) {
  return barometer ? barometer.temperature : 0;
}

function getMagnetometerTemperature(magnometer) {
  return magnometer ? magnometer.temp : 0;
}

function getCpu(cpuUptime) {
  if(!cpuUptime) {
    return 0;
  };

  return cpuUptime[0];
}

function as(inputValue) {
  return function(e) {
    return {
      input: inputValue
    };
  };
}
