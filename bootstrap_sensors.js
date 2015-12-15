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

  /*
  var OLED = require('./outputs/OLED');
  var redrawTimer = setInterval(function() {

    console.log(JSON.stringify(state, null, '\t'));

    var title = [
    state.time
    ].join('');

    var status = [
    'TMP:',
    Math.round(state.temp),
    '* | CPU:',
    Math.round(state.cpu * 1000) / 1000 
    ].join('');

    var main = {
      display: "HELLO WORLD!"
    }

    OLED(title, main, status);

  }, 1000);
  */

  return source;

}

module.exports = bootstrap;