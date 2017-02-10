var Rx = require('rxjs');
var _ = require('lodash');

module.exports = function bootstrap(sensorsConfig, noGps) {
  
  // var odometerPin = 25 //2;
  // var odometer = require('./sensors/odometer')(odometerPin);
  // ... odometer.subscribe(console.log);

  var clock = require('./sensors/clock')();

  var sensors = Rx.Observable.merge(

    // tick tick tick
    clock,

    // sensors

    // ****
    noGps
      ? Rx.Observable.empty()
      : safeRequire('./sensors/gps')(),
    // ****

    safeRequire('./sensors/lsm303')(sensorsConfig.lsm303),
    safeRequire('./sensors/barometer')(sensorsConfig.temperature),

    // wifi scanner
    (sensorsConfig.indiscreet)
      ? require('./sensors/wifi')(sensorsConfig.indiscreet.wifi)
      : Rx.Observable.empty(),
    
    // sys
    require('./sensors/cpu_temperature')(sensorsConfig.temperature),
    require('./sensors/cpu_load')(sensorsConfig.cpu),
    require('./sensors/memory')(sensorsConfig.memory))
  .share();

  // stamp!
  var lastTs = null;
  const getTimestamp = () => lastTs.gps + (Date.now() - lastTs.cpu);
  clock.subscribe((o) => lastTs = {
        cpu: Date.now(),
        gps: o.value
      });
  
  return sensors
    // ignore events before clock is gps synched
    .filter(() => lastTs !== null)
    .map(o => _.assign({ timestamp: getTimestamp() }, o)) 
    .share();
}

function safeRequire(moduleName) {
  try {
    var dontCrashPlease = require(moduleName);
    var didntCrash = dontCrashPlease;
    return didntCrash;
  } catch(err) {
    console.log('Sensor.' + moduleName + '.err!', err);
    return () => Rx.Observable.empty();
  }
}
