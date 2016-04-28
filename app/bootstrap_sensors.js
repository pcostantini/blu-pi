var Rx = require('rxjs');
var _ = require('lodash');

module.exports = function bootstrap(sensorsConfig) {
  
  // var odometerPin = 25 //2;
  // var odometer = require('./sensors/odometer')(odometerPin);
  // ... odometer.subscribe(console.log);

  // TODO: use CPU clock when GPS clock is not available

  var clock = require('./sensors/clock')();
  var sensors = Rx.Observable.merge(
    clock,
    safeRequire('./sensors/gps')(),
    safeRequire('./sensors/lsm303')(sensorsConfig.lsm303),
    safeRequire('./sensors/barometer')(sensorsConfig.temperature),

    (sensorsConfig.indiscreet)
      ? require('./sensors/wifi')(sensorsConfig.indiscreet.wifi)
      : Rx.Observable.empty(),
        
    // sys
    // require('./sensors/cpu_temperature')(sensorsConfig.temperature),
    require('./sensors/cpu_load')(),
    require('./sensors/memory')() 

    ).share();

  // current stamp
  var lastTs = null;
  const getTimestamp = () => lastTs.gps + (Date.now() - lastTs.cpu);
  clock.do((o) => lastTs = {
            cpu: Date.now(),
            gps: o.value
          }).subscribe(function() {});
  
  // stamp!
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