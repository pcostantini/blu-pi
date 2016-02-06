var Rx = require('rx');

// TODO: READ FAST!!!
var pauseRead = 333;

function LSM303_Observable() {

  return Rx.Observable.create(function (observer) {

    function handleRead(sensorName, reCallback) {
      return function(err, sensorData) {
        if(err) {
          // TODO: log err!
          console.log('ls303.err!', err);
        } else {

          // TODO: RESOLVE OR RETURN BUFFERED SAMPLES ON ARRAY FROM ABOVE LAYER
          // console.log(sensorData);

          observer.onNext({ name: sensorName, value: sensorData });
        }

        setTimeout(reCallback, pauseRead);
      };
    }

    try {
      var LSM303 = require('lsm303');
      var ls = new LSM303();
      var accel = ls.accelerometer();
      var mag = ls.magnetometer();

      // read
      (function accelReadAxes() {
        accel.readAxes(handleRead('Acceleration', accelReadAxes));
      })();

      (function magReadAxes() {
        mag.readAxes(handleRead('MagnometerAxis', magReadAxes));
      })();

      (function magReadHeading() {
        mag.readHeading(handleRead('MagnometerHeading', magReadHeading));
      })();

      // useless!
      (function magReadTemp() {
        mag.readTemp(handleRead('MagnometerTemperature', magReadTemp));
      })();

    } catch(err) {
      console.log('lsm303.initErr!', err);
    }

  });
}

module.exports = LSM303_Observable;