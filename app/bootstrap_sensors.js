var Rx = require('rx');

function bootstrap(sensorsConfig) {
  
  // var odometerPin = 25 //2;
  // var odometer = require('./sensors/odometer')(odometerPin);
  // ... odometer.subscribe(console.log);

  var sensors = [
    require('./sensors/lsm303')(sensorsConfig.lsm303),
    require('./sensors/barometer')(sensorsConfig.temperature),
    require('./sensors/gps')(),
    // sys
    require('./sensors/cpu_temperature')(sensorsConfig.temperature),
    require('./sensors/cpu_load')()];

  // TODO: handle errors here?
  return Rx.Observable.merge(sensors);

}

module.exports = bootstrap;
