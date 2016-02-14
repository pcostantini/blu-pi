var Rx = require('rx');

// TODO: READ FAST!!!
function LSM303_Observable(waitTimes) {

  return Rx.Observable.create(function (observer) {

    function handleRead(sensorName, reCallback, wait) {
      return function(err, sensorData) {
        if(err) {
          // TODO: log err!
          console.log('ls303.err!', err);
        } else {

          // TODO: RESOLVE OR RETURN BUFFERED SAMPLES ON ARRAY FROM ABOVE LAYER
          // console.log(sensorData);

          observer.onNext({ name: sensorName, value: sensorData });
        }

        setTimeout(reCallback, wait);
      };
    }

    try {
      var LSM303 = require('lsm303');
      var ls = new LSM303();
      var accel = ls.accelerometer();
      var mag = ls.magnetometer();

      // read
      (function accelReadAxes() {
        accel.readAxes(handleRead('Acceleration', accelReadAxes, waitTimes.acceleration /*500*/));
      })();

      (function magReadAxes() {
        mag.readAxes(handleRead('MagnometerAxis', magReadAxes, waitTimes.axes/*500*/));
      })();

      (function magReadHeading() {
        mag.readHeading(handleRead('MagnometerHeading', magReadHeading, waitTimes.heading/*1000*/));
      })();

      // useless?
      (function magReadTemp() {
        mag.readTemp(handleRead('MagnometerTemperature', magReadTemp, waitTimes.temp/*5000*/));
      })();

    } catch(err) {
      console.log('lsm303.initErr!', err);
    }

  });

}

module.exports = LSM303_Observable;
