var Rx = require('rx');
var _ = require('lodash');

function bootstrap() {

  /*
  var odometerPin = 2;
  var odomoter = require('./odometer')(odometerPin);
  */

  var state = { };
  function updateState(newstate) {
    state = _.extend(state, newstate);
  }

  // cpu temp
  var sensors = [];
  sensors.push(require('./sensors/clock')());
  sensors.push(require('./sensors/cpu_temperature')());
  sensors.push(require('./sensors/cpu_load')());
  sensors.push(require('./sensors/gps')());
  sensors.push(require('./sensors/clock')());

  // console.log('sensors', sensors);

  // merge and sample every second
  // store latest values of each sensor stream
  var source =  Rx.Observable.combineLatest(sensors)
    .bufferWithTime(1000)
    .map(_.last);
    
  return source;

}

module.exports = bootstrap;