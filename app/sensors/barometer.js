var Rx = require('rxjs');
var BMP085 = require('bmp085');

function Barometer(delay) {
  if(!delay) delay = 5000;

  return Rx.Observable.create(function (observer) {
    function read(sensor) {
      try {
        sensor.read(function (data) {
          observer.next({ name: 'Barometer', value: data });
        });
      } catch(err) {
        console.log('Barometer.err!', err);
      }

      setTimeout(() => read(sensor), delay);
    }


    var sensor = new BMP085()
    read(sensor);
  });
}

module.exports = Barometer;
