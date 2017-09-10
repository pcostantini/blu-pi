var Rx = require('rxjs');
var _ = require('lodash');

module.exports = function bootstrap(sensorsConfig) {

  // var odometerPin = 25 //2;
  // var odometer = require('./sensors/odometer')(odometerPin);
  // ... odometer.subscribe(console.log);

  var sensors = Rx.Observable.merge(

    safeRequire('./sensors/gps')(),

    safeRequire('./sensors/lsm303')(sensorsConfig.lsm303),

    (sensorsConfig.temperature)
      ? safeRequire('./sensors/barometer')(sensorsConfig.temperature)
      : Rx.Observable.empty(),

    (sensorsConfig.indiscreet)
      ? require('./sensors/wifi')(sensorsConfig.indiscreet.wifi)
      : Rx.Observable.empty(),

    // sys
    require('./sensors/cpu_temperature')(sensorsConfig.temperature),
    require('./sensors/cpu_load')(sensorsConfig.cpu),
    require('./sensors/memory')(sensorsConfig.memory))
  .share();

  // timestamp!
  return sensors
    .map(o => _.assign({ timestamp: Date.now() }, o))
    .share();
}

function safeRequire(moduleName) {
  try {
    return require(moduleName);
  } catch(err) {
    console.log('Sensor.' + moduleName + '.err!', err);
    return () => Rx.Observable.empty();
  }
}
