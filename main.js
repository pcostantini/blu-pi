var _ = require('lodash');
var OLED = require('./outputs/OLED');
var sensors = require('./bootstrap_sensors');

var sensorsStream = sensors();

// log
var db = require('./persistence').OpenDb();
sensorsStream.subscribe(function(o) {
  // persist
  console.log('sensors:', o);

  db.insert(o);
});

// oled
sensorsStream
  .bufferWithTime(5000)
  .map(_.last)
  .map(function (state) {
    return {
      time:   get(state, 'Clock').toLocaleTimeString().split(':').slice(0, -1).join(':'),
      temp:   get(state, 'CpuTemperature'),
      cpu:    get(state, 'CpuLoad')[0],
      gpsFix: get(state, 'GPS') !== null
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

