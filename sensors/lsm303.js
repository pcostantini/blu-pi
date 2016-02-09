var Rx = require('rx');
var LSM303 = require('lsm303');

// TODO: READ FAST!!!
var pauseRead = 250;

function LSM303_Observable() {
  return Rx.Observable.create(function (observer) {

    function handleRead(sensorName, reCallback) {
      return function(err, sensorData) {
        if(err) {
          // throw err!
          console.log(err);
          return;
        }

        // TODO: RESOLVE OR RETURN BUFFERED SAMPLES ON ARRAY FROM ABOVE LAYER
        observer.onNext({ name: sensorName, value: sensorData });

        setTimeout(reCallback, pauseRead);
      };
    }

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

    return observer;
  });
}

module.exports = LSM303_Observable;
