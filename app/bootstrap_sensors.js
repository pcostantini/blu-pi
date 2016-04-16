var Rx = require('rx');
var _ = require('lodash');

function bootstrap(sensorsConfig) {
  
  // var odometerPin = 25 //2;
  // var odometer = require('./sensors/odometer')(odometerPin);
  // ... odometer.subscribe(console.log);

  var ts = require('./sensors/gps_timestamp')().share();

  var sensors = [
    ts,
    require('./sensors/gps')(),
    require('./sensors/lsm303')(sensorsConfig.lsm303),
    // require('./sensors/barometer')(sensorsConfig.temperature),
    // sys
    require('./sensors/cpu_temperature')(sensorsConfig.temperature),
    require('./sensors/cpu_load')()];


  // TODO: handle errors here?
  var sensors = Rx.Observable.merge(sensors).share();
  
  // use gps timestamp
  var lastTs = null;
  const getTimestamp = () => lastTs.gps + (new Date().getTime() - lastTs.cpu);
  ts.do((s) => lastTs = {
            cpu: new Date().getTime(),
            gps: s.value
          }).subscribe(function() {});
  
  return sensors
    .filter(() => lastTs !== null)                            // ignore previous events to GPS.Timestamp =(
    .select(s => _.extend({ timestamp: getTimestamp() }, s))  // timestamped events
    .share();

}

module.exports = bootstrap;
