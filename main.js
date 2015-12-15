var _ = require('lodash');
var OLED = require('./outputs/OLED');
var bootstrapSensors = require('./bootstrap_sensors');
var persistence = require('./persistence');


var sensorsStream = bootstrapSensors();

// log
var db = persistence.OpenDb('sensors.sqlite3');
sensorsStream
  .where(_.negate(_.isEmpty))
  .subscribe(db.insert);

// oled
sensorsStream
  .bufferWithTime(5000)
  .map(_.last)
  .map(function (state) {
    return {
      time:   get(state, 'Clock').toLocaleTimeString().split(':').slice(0, -1).join(':'),
      temp:   get(state, 'CpuTemperature'),
      cpu:    get(state, 'CpuLoad')[0],
      gpsFix: get(state, 'GPS') !== null  // TODO: use GPS.mode > 1 (0=no mode, 1=no fix)
    };
  })
  // .subscribe(OLED.displayState)
  .subscribe(console.log);

var gpio = require('./gpios');
var pin = gpio.readPin(23);
pin.subscribe(console.log);

// helpers
function get(state, key) {
  return _.find(state, function(o) { return o.name === key; }).value;
}

