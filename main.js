var _ = require('lodash');
var OLED = require('./outputs/OLED');
var bootstrapSensors = require('./bootstrap_sensors');
var persistence = require('./persistence');


// ???
var gpio = require('./gpios');
var pin = gpio.readPin(23);
pin.subscribe(console.log);
// ???


var config = {
  utfOffset: new Date().getTimezoneOffset(),
  dbFile: 'sensors-' + new Date().getTime() + '.sqlite3'
}

var state = { };
function updateState(newstate) {
  state = _.extend(state, newstate);
}

var sensorsStream = bootstrapSensors();

// log
var db = persistence.OpenDb(config.dbFile);
sensorsStream
  // .map(echo)
  .where(_.negate(_.isEmpty))
  .subscribe(db.insert);

// display stats
var oled = false;
sensorsStream
  .bufferWithTime(5000)
  .map(_.last)
  .map(function (state) {
    return {
      time:   getState(state, 'Clock').toLocaleTimeString().split(':').slice(0, -1).join(':'),
      temp:   getState(state, 'CpuTemperature'),
      cpu:    getState(state, 'CpuLoad')[0],
      gpsFix: (getState(state, 'GPS') || { mode: 0 }).mode > 1  // TODO: use GPS.mode > 1 (0=no mode, 1=no fix)
    };
  })
  .subscribe(oled ? OLED.displayState : console.log);



// helpers
function getState(state, key) {
  return _.find(state, function(o) { return o.name === key; }).value;
}

function echo(o) { console.log(o); return o; };
