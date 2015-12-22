var Rx = require('rx');
var _ = require('lodash');

function bootstrap() {

  /*
  var odometerPin = 2;
  var odomoter = require('./odometer')(odometerPin);
  */
  
  var sensors = [];
  function add(sensorStream) {
    sensors.push(sensorStream);
    return sensorStream;
  }

  add(require('./sensors/lsm303')())
  add(require('./sensors/barometer')())
  add(require('./sensors/cpu_temperature')())
  add(require('./sensors/cpu_load')())
  add(require('./sensors/gps')())
  add(require('./sensors/clock')())

  // merge and sample every second
  // store latest values of each sensor stream
  var source =  Rx.Observable.combineLatest(sensors)
    .bufferWithTime(1000)
    .map(_.last);
    
  return source;

}

module.exports = bootstrap;
