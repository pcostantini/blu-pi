var Rx = require('rx');
var BMP085 = require('bmp085');

function Barometer(delay) {
  if(!delay) delay = 5000;

  return Rx.Observable.create(function (observer) {
    function read(sensor) {
        sensor.read(function (data) {
          observer.onNext({ name: 'Barometer', value: data });
        });

      setTimeout(() => read(sensor), delay);
    }


    var sensor = new BMP085()
    read(sensor);
  });
}

module.exports = Barometer;
