var Rx = require('rx');
var BMP085 = require('bmp085');

function Barometer() {
  return Rx.Observable.create(function (observer) {
  	var barometer = new BMP085();

  	function read() {
      try {
        barometer.read(function (data) {
          observer.onNext({ name: 'Temperature', value: data.temperature });
          observer.onNext({ name: 'Pressure', value: data.pressure });
        });

        setTimeout(read, 1000);
      } catch(err) {
        console.log('BMP085.ERR!', err);
        // retry?
      }
  	}

  	read();
  });
}

module.exports = Barometer;