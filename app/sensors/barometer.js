var Rx = require('rx');

function Barometer() {
  return Rx.Observable.create(function (observer) {

    function read(barometer) {
      try {
        barometer.read(function (data) {
          observer.onNext({ name: 'Barometer', value: data });
        });

      } catch(err) {
        console.log('barometer.err!', err);
      }

      setTimeout(() => read(barometer), 2000);
    }

    try {
      var BMP085 = require('bmp085');
      //var barometer = new BMP085({ mode: 2 }); // highres mode
      var barometer = new BMP085();
      read(barometer);
    } catch(err) {
      console.log('barometer.initErr!', err);
    }

  });
}

module.exports = Barometer;
