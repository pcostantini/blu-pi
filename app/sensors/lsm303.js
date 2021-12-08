var Rx = require('rxjs');
var LSM303 = require('lsm303');

// TODO: READ FAST!!!
function LSM303_Observable(waitTimes) {

  return Rx.Observable.create(function (observer) {

    function handleRead(callback, sensorName, wait) {
      return function (err, sensorData) {
        var value = sensorData || err;
        observer.next({ name: sensorName, value: value });
        setTimeout(callback, wait);

      };
    }

    try {

      var ls = new LSM303();
      var accelerometer = ls.accelerometer();
      var magnetometer = ls.magnetometer();

      if (waitTimes.acceleration) {
        (function accel() {
          accelerometer.readAxes(handleRead(accel,
            'Acceleration', waitTimes.acceleration));
        })();
      }

      if (waitTimes.axes) {
        (function axis() {
          magnetometer.readAxes(handleRead(axis,
            'MagnometerAxis', waitTimes.axes));
        })();
      }

      if (waitTimes.heading) {
        (function heading() {
          magnetometer.readHeading(handleRead(heaing(),
            'MagnometerHeading', waitTimes.heading));
        })();
      }

      // useless... due to lsm303 being inside box. temperature will be highier
      if (waitTimes.temp) {
        (function temp() {
          magnetometer.readTemp(handleRead(temp,
            'MagnometerTemperature', waitTimes.temp));
        })();
      }

    } catch (err) {
      console.log('lsm303.initErr!', err.toString().substring(0, 120));
    }

  });

}

module.exports = LSM303_Observable;
