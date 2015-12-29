var Rx = require('rx');
var LSM303 = require('lsm303');

var readIntervalMs = 1000;

function LSM303_Observable() {
  return Rx.Observable.create(function (observer) {

    function handleRead(sensorName, reCallback) {
      return function(err, sensorResp) {
        if(err) {
          // throw err!
          console.log(err);
          return;
        }

        observer.onNext({ name: sensorName, value: sensorResp });

        setTimeout(reCallback, readIntervalMs)
      };
    }

    var ls = new LSM303();
    var accel = ls.accelerometer();
    var mag = ls.magnetometer();

    // read
    (function accelReadAxes() {
      accel.readAxes(handleRead('Accelerometer', accelReadAxes));
    })();

    (function magReadAxes() {
      mag.readAxes(handleRead('MagnetometerAxes', magReadAxes));
    })();

    (function magReadHeading() {
      mag.readHeading(handleRead('MagnetometerHeading', magReadHeading));
    })();

    // useless!
    (function magReadTemp() {
      mag.readTemp(handleRead('MagnetometerTemperature', magReadTemp));
    })();

    return observer;
  });
}

module.exports = LSM303_Observable;