var Rx = require('rx');
var LSM303 = require('lsm303');

// TODO: READ FAST!!!
function LSM303_Observable(waitTimes) {
  return Rx.Observable.create(function (observer) {

    function handleRead(sensorName, reCallback, wait) {
      return function(err, sensorData) {
        if(err) {
          // throw err!
          console.log(err);
          return;
        }

        // TODO: RESOLVE OR RETURN BUFFERED SAMPLES ON ARRAY FROM ABOVE LAYER
        observer.onNext({ name: sensorName, value: sensorData });

        setTimeout(reCallback, wait);
      };
    }

    var ls = new LSM303();
    var accel = ls.accelerometer();
    var mag = ls.magnetometer();

    var waitTime = {
      acceleration: 500,
      axes: 500,
      heaing: 1000,
      temp: 5000
    };

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

    return observer;
  });

}

module.exports = LSM303_Observable;
