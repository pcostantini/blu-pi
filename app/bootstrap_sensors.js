var Rx = require('rxjs');
var _ = require('lodash');

module.exports = function bootstrap(sensorsConfig) {
  
  // var odometerPin = 25 //2;
  // var odometer = require('./sensors/odometer')(odometerPin);
  // ... odometer.subscribe(console.log);

  var clock = require('./sensors/clock')().share();

  var sensors = [
    clock,
    require('./sensors/gps')(),
    require('./sensors/lsm303')(sensorsConfig.lsm303),
    require('./sensors/barometer')(sensorsConfig.temperature),
    // sys
    require('./sensors/cpu_temperature')(sensorsConfig.temperature),
    require('./sensors/cpu_load')(),
    require('./sensors/memory')()];


  // TODO: handle errors here?
  var sensors = Rx.Observable.merge(sensors).share();
  
  // stamp all events
  // with clock milliseconds

  // current stamp
  var lastTs = null;
  const getTimestamp = () => lastTs.gps + (Date.now() - lastTs.cpu);
  clock.do((s) => lastTs = {
            cpu: Date.now(),
            gps: s.value
          }).subscribe(function() {});
  
  // stamp!
  return sensors
    .filter(() => lastTs !== null)                            // ignore previous events to sync clock with Gps
    .map(s => _.extend({ timestamp: getTimestamp() }, s)) 
    .share();

}
