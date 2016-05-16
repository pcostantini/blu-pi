var Rx = require('rxjs');
var _ = require('lodash');

module.exports = function bootstrap(sensorsConfig) {
  
  // var odometerPin = 25 //2;
  // var odometer = require('./sensors/odometer')(odometerPin);
  // ... odometer.subscribe(console.log);

  var clock = require('./sensors/clock')();
  var sensors = Rx.Observable.merge(
    clock,
    safeRequire('./sensors/gps')(),
    safeRequire('./sensors/lsm303')(sensorsConfig.lsm303),
    safeRequire('./sensors/barometer')(sensorsConfig.temperature),

    require('./sensors/wifi')(sensorsConfig.wifi),
        
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
    .filter(() => lastTs !== null)       // ignore events before clock is gps synched
    .map(o => _.assign({ timestamp: getTimestamp() }, o)) 
    .share();

}

function safeRequire(moduleName) {

  try {
    return require(moduleName)
  } catch(err) {
    console.log(moduleName + '.err!', err);

    return () => Rx.Observable.empty();
  }

}