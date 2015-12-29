var Rx = require('rx');
var _ = require('lodash');

function bootstrap() {

  'use strict';

  // var odometerPin = 25 //2;
  // var odometer = require('./sensors/odometer')(odometerPin);
  // ... odometer.subscribe(console.log);

  var sensors = [];


  var clock = require('./sensors/clock')();
  sensors.push(clock);
  
  var ts = clock.select(function(sensor) {
    return {
      name: 'ClockTs',
      value: sensor.value.getTime()
    };
  });
  sensors.push(ts);

  var start = new Date().getTime();
  var aMinute = 1000 * 60;
  var anHour = aMinute * 60;
  var aQuarter = 15;

  var ticks = ts.select(function(sensor) {
    
    var ticksSinceStart = sensor.value - start;
    var hours = Math.floor(ticksSinceStart / anHour);
    var minutes = Math.floor(ticksSinceStart / aMinute);
    var quarters = Math.floor(minutes / aQuarter);

    return {
      name: 'Ticks',
      value: [
        ticksSinceStart,
        minutes,
        [ hours, minutes % 60 ],
        [ quarters, minutes % aQuarter ]
      ]
    };
  });
  sensors.push(ticks);

  sensors.push(require('./sensors/lsm303')());
  sensors.push(require('./sensors/barometer')());
  sensors.push(require('./sensors/cpu_temperature')()); // TODO: perf measure!
  sensors.push(require('./sensors/cpu_load')());
  sensors.push(require('./sensors/gps')());

  // TODO: handle errors
  return Rx.Observable.merge(sensors);

}

function echo(o) { console.log(o); return o; };

module.exports = bootstrap;

