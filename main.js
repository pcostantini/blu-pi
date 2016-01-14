"use strict";

console.log('starting pi-blu...')
var startTs = new Date();

var _ = require('lodash');
var Rx = require('rx');

var bootstrapSensors = require('./bootstrap_sensors');

// config
var config = {
  persist: true,
  dbFile: './data/sensors-' + startTs + '.sqlite3',
  displayFunc: require('./outputs/OLED').displayState
};

// // INPUTS
// var gpio = require('./gpios');

// // odometer pin
// // gpio.readPin(18).subscribe(console.log);
// var inputBack = gpio.readPin(23);
// var inputNext = gpio.readPin(24);
// var inputOk = gpio.readPin(25);

// var input = Rx.Observable.combineLatest([
//   inputBack, inputNext, inputOk ]);

// input.subscribe(console.log);

// INIT sensors
var sensors = bootstrapSensors();
var snapshot = sensors
    .scan(aggregateSensorState, {})
    .throttle(1000);

// persist every second a snapshot of sensors
if(config.persist) {
  var persistence = require('./session_persistence');
  var db = persistence.OpenDb(config.dbFile);

  snapshot.subscribe(db.insert);
}

// display
if(config.displayFunc) {
  snapshot
    .throttle(4000)
    .select(function (snapshot) {
      return {
        time:   getTime(snapshot.Clock),
        temp:   getMagnetometerTemperature(snapshot.MagnetometerTemperature),
        cpu:    getCpu(snapshot.CpuLoad),
        gpsFix: hasGpsFix(snapshot.GPS),
        heading:snapshot.MagnetometerHeading,
        ticking:snapshot.Ticks
      };
    })
    .select(echo)
    .subscribe(config.displayFunc);
}

// done
var endTs = new Date();
console.log('ready! took %d \'\'', (endTs - startTs) / 1000 );

// var orientationAndSpeed = sensors
//   .where(nameIn(['MagnetometerHeading', 'Accelerometer', 'MagnetometerAxes']))
//   .scan(aggregateSensorState, {});

  // .map(JSON.stringify)
  // .subscribe(console.log);

// REPL support
var replify = require('replify');
var app = {
  sensors: sensors,
  config: config
};
replify('pi-blu', app);
console.log('REPL READY!: nc -U /tmp/repl/pi-blu.sock');









// helpers
function aggregateSensorState(state, sensor) {
  var o = {};
  o[sensor.name] = sensor.value;
  return _.extend(state, o);
}

function nameIn(names) {
  return function(s) {
    return names.indexOf(s.name) > -1;
  };
}
function nameIs(name) {
  return function(s) {
    return s.name === name;
  };
}

// function getState(state, key) {
//   var stateTuple = _.find(state, function(o) { return o.name === key; });
//   return stateTuple ? stateTuple.value : null;
// }

function echo(o) { console.log(o); return o; };

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