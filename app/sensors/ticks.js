var Rx = require('rxjs');

module.exports = function Ticks(clock) {
  var startTick = Date.now();

  return clock.map((clock) => {

    var aMinute = 1000 * 60;
    var anHour = aMinute * 60;
    var aQuarter = 15;

    var ticksSinceStart = clock.value - startTick;
    var hours = Math.floor(ticksSinceStart / anHour);
    var minutes = Math.floor(ticksSinceStart / aMinute);
    var quarters = Math.floor(minutes / aQuarter);

    return {
      name: 'Ticks',
      value: [
        ticksSinceStart,
        minutes,
        [hours, minutes % 60],
        [quarters, minutes % aQuarter]
      ]
    };

  });

}