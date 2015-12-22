var _ = require('lodash');
var bootstrapSensors = require('./bootstrap_sensors');
var persistence = require('./persistence');


// config
var config = {
  persist: false,
  dbFile: 'sensors-' + new Date().getTime() + '.sqlite3',
}

// CUSTOM INIT
var gpio = require('./gpios');
gpio.readPin(25).subscribe(console.log);
gpio.readPin(23).subscribe(console.log);
gpio.readPin(18).subscribe(console.log);
gpio.readPin(24).subscribe(console.log);


console.log('ready!');

// INIT sensors
var sensors = bootstrapSensors();

// log
if(config.persist) {
  var db = persistence.OpenDb(config.dbFile);
  sensors
    .where(_.negate(_.isEmpty))
    .subscribe(db.insert);

}

// display stats
var displayFunc = require('./outputs/OLED').displayState;
sensors
  .bufferWithTime(4000)
  .map(_.last)
  .map(function (state) {
    return {
      time:   getTime(getState(state, 'Clock')),
      temp:   getTemp(getState(state, 'Barometer')),
      cpu:    getState(state, 'CpuLoad')[0],
      gpsFix: hasGpsFix(getState(state, 'GPS')),
      heading:getState(state, 'MagnetometerHeading')
    };
  })
  .map(echo)
  .subscribe(displayFunc);



// helpers
function getState(state, key) {
  var stateTuple = _.find(state, function(o) { return o.name === key; });
  return stateTuple ? stateTuple.value : null;
}

function echo(o) { console.log(o); return o; };


function getTime(date) {
  return date ? date.toLocaleTimeString().split(':').slice(0, -1).join(':') : '00:00';
}

function hasGpsFix(gps) {
  return !!gps && gps.mode > 1
}

function getTemp(barometer) {
  return barometer ? barometer.temperature : 0;
}
