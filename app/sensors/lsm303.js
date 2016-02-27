var Rx = require('rx');
var LSM303 = require('lsm303');

// TODO: READ FAST!!!
function LSM303_Observable(waitTimes) {

  return Rx.Observable.create(function (observer) {

    function handleRead(callback, sensorName, wait) {
      return function(err, sensorData) {
        var value = sensorData || err;
        observer.onNext({ name: sensorName, value: value });
        setTimeout(callback, wait);

      };
    }

    try {

      var ls = new LSM303();
      var accelerometer = ls.accelerometer();
      var magnetometer = ls.magnetometer();

      (function accel() {
        accelerometer.readAxes(handleRead(accel, 
          'Acceleration', waitTimes.acceleration));
      })();

      (function axis() {
        magnetometer.readAxes(handleRead(axis, 
          'MagnometerAxis', waitTimes.axes));
      })();

      (function heading() {
        magnetometer.readHeading(handleRead(heading, 
          'MagnometerHeading', waitTimes.heading));
      })();

      // useless due to lsm303 being inside box. temperature will be highier
      /*(function temp() {
        magnetometer.readTemp(handleRead(temp, 
          'MagnometerTemperature', waitTimes.temp));
      })();*/

    } catch(err) {
      console.log('lsm303.initErr!', err);
    }

  });

}

module.exports = LSM303_Observable;
