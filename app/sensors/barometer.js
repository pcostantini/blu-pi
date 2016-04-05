var Rx = require('rx');
var bmp085 = require('bmp085-sensor');

function Barometer(delay) {
  if(!delay) delay = 5000;

  return Rx.Observable.create(function (observer) {
    function read(sensor) {
        sensor.read(function (err, data) {
          observer.onNext({ name: 'Barometer', value: data });
        });

      setTimeout(() => read(sensor), delay);
    }


    var sensor = bmp085({address: 0x77, mode: 3, units: 'metric'});
    read(sensor);
  });
}

module.exports = Barometer;
