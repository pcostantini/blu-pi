var Rx = require('rx');
var _ = require('underscore');

function bootstrap() {

  'use strict';
  
  // var odometerPin = 25 //2;
  // var odometer = require('./sensors/odometer')(odometerPin);
  // ... odometer.subscribe(console.log);

  var sensors = [];

  // sensors
  sensors.push(require('./sensors/lsm303')());
  sensors.push(require('./sensors/barometer')());
  sensors.push(require('./sensors/gps')());

  // system
  sensors.push(require('./sensors/cpu_temperature')());
  sensors.push(require('./sensors/cpu_load')());
  sensors.push(require('./sensors/freem')());

  // TODO: handle errors
  return Rx.Observable.merge(sensors);

}

function echo(o) { console.log(o); return o; };

module.exports = bootstrap;

