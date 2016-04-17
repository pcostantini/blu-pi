var Rx = require('rx');
var Clock = require('./clock');

var sensorName = 'Ticks';
module.exports = function Ticks(clock) {

  var startTick = Date.now();

  return clock.select(function(clock) {

    var aMinute = 1000 * 60;
    var anHour = aMinute * 60;
    var aQuarter = 15;
    
    var ticksSinceStart = clock.value - startTick;
    var hours = Math.floor(ticksSinceStart / anHour);
    var minutes = Math.floor(ticksSinceStart / aMinute);
    var quarters = Math.floor(minutes / aQuarter);

    return {
      name: sensorName,
      value: [
        ticksSinceStart,
        minutes,
        [ hours, minutes % 60 ],
        [ quarters, minutes % aQuarter ]
      ]
    };

  });

}