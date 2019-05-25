var Rx = require('rxjs');
var _ = require('lodash');

module.exports = function bootstrap(sensorsConfig) {

  var sensors = Rx.Observable.merge(

    // GPS
    safeRequire('./sensors/gps')(),

    // TODO: Read from config.js and safeRequire each item
    // TODO: ? Move sensors init params to constants within sensor code

    // Odometer and velocimeter
    // safeRequire('./sensors/odometer')(),

    // LSM303 - 3X Accelerometer & Magnometer
    // safeRequire('./sensors/lsm303')(sensorsConfig.lsm303),

    // BMP085 - Temp and Pressure
    // (sensorsConfig.temperature)
    //   ? safeRequire('./sensors/barometer')(sensorsConfig.temperature)
    //   : Rx.Observable.empty(),

    // Wifi scanner
    // (sensorsConfig.indiscreet)
    //   ? require('./sensors/wifi')(sensorsConfig.indiscreet.wifi)
    //   : Rx.Observable.empty(),

    // sys
    require('./sensors/cpu_temperature')(sensorsConfig.temperature),
    require('./sensors/cpu_load')(sensorsConfig.cpu),
    require('./sensors/memory')(sensorsConfig.memory)
  ).share();

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
