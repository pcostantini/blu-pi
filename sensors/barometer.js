var Rx = require('rx');
var BMP085 = require('bmp085');

function Barometer() {
  return Rx.Observable.create(function (observer) {
  	var barometer = new BMP085({ mode: 3 });

  	function read() {
      try {
        barometer.read(function (data) {
          observer.onNext({ name: 'Barometer', value: data });
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