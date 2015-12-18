var _ = require('lodash');
var bootstrapSensors = require('./bootstrap_sensors');
var persistence = require('./persistence');


// ???
var gpio = require('./gpios');
gpio.readPin(25).subscribe(console.log);
gpio.readPin(23).subscribe(console.log);
gpio.readPin(18).subscribe(console.log);
gpio.readPin(24).subscribe(console.log);
console.log('ready!');
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
var displayFunc = require('./outputs/OLED').displayState;

// sensorsStream
//   .bufferWithTime(5555)
//   .map(_.last)
//   .map(function (state) {
//     return {
//       time:   getState(state, 'Clock').toLocaleTimeString().split(':').slice(0, -1).join(':'),
//       temp:   getState(state, 'Temperature'),
//       cpu:    getState(state, 'CpuLoad')[0],
//       gpsFix: (getState(state, 'GPS') || { mode: 0 }).mode > 1,  // TODO: use GPS.mode > 1 (0=no mode, 1=no fix)
//       heading:getState(state, 'MagnetometerHeading')
//     };
//   })
//   .subscribe(displayFunc);



// helpers
function getState(state, key) {
  var stateTuple = _.find(state, function(o) { return o.name === key; });
  return stateTuple
    ? stateTuple.value
    : null;
}

function echo(o) { console.log(o); return o; };
