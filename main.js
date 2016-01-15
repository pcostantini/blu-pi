"use strict";

console.log('starting pi-blu...');
var startTs = new Date();

var _ = require('lodash');
var Rx = require('rx');

var bootstrapSensors = require('./bootstrap_sensors');

// config - TODO: READ FROM ENV.VARS
var config = {
  persist: true,
  dbFile: 'sensors-' + new Date().getTime() + '.sqlite3',
  displayFunc: console.log // require('./outputs/OLED').displayState
};

// INPUTS (WIP)
var gpio = require('./gpios');
var inputBack = gpio.readPin(18, 0).select(as(-1));
var inputNext = gpio.readPin(23, 0).select(as(0));
var inputOk = gpio.readPin(25, 0).select(as(1));
var input = Rx.Observable.merge([ inputBack, inputNext, inputOk ])
input.subscribe(console.log);

// INIT sensors
var sensors = bootstrapSensors();
var snapshot = sensors
    .scan(aggregateSensorState, {})
    .throttle(1000);

// persist every second a snapshot of sensor data
if(config.persist) {
  var persistence = require('./persistence');
  var db = persistence.OpenDb(config.dbFile);

  snapshot.subscribe(db.insert);
}

// TODO: EXTRACT
var displayState = snapshot
    .throttle(5000)
    .select(function (snapshot) {
      return {
        time:   getTime(snapshot.Clock),
        temp:   getMagnetometerTemperature(snapshot.MagnetometerTemperature),
        cpu:    getCpu(snapshot.CpuLoad),
        gpsFix: hasGpsFix(snapshot.GPS),
        heading:snapshot.MagnetometerHeading,
        ticking:snapshot.Ticks
      };
    });

if(config.displayFunc) {
  displayState.subscribe(config.displayFunc);
}

var app = {
  config: config,
  streams: {
    sensors: sensors,
    snapshot: snapshot,
    displayState: displayState
  }
};

// REPL support
initRepl(app);
function initRepl(app) {
  var replify = require('replify');
  replify('pi-blu', app);
  console.log('REPL READY!: nc -U /tmp/repl/pi-blu.sock');
}

// done
var endTs = new Date();
console.log('ready! took %d \'\'', (endTs - startTs) / 1000 );

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