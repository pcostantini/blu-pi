var lsm303 = require('./lsm303');
var Rx = require('rxjs');

// TODO: READ FAST!!!
function ShakeSensor() {

    return Rx.Observable.create(function (observer) {

        var options = {
            readFrequency: 1,
            threshold: 5,
            timeout: 333
        };

        var lsm303_stream = lsm303({
            acceleration: options.readFrequency,
            //   axes: 100,
            //   heading: 500
            //temp: 5000
        });

        lastTime = new Date();

        // accelerometer values
        lastX = null;
        lastY = null;
        lastZ = null;

        lsm303_stream.subscribe(function deviceMotion(e) {
            var current = e.value;

            var x = Math.abs(current.x);
            var y = Math.abs(current.y);
            var z = Math.abs(current.z);

            lastX = lastX + x;
            lastY = lastY + y;
            lastZ = lastZ + z;

            if (lastX >= options.threshold ||
                lastY >= options.threshold) {

                var currentTime = new Date();
                var timeDifference = currentTime.getTime() - lastTime.getTime();

                if (timeDifference > options.timeout) {
                    lastTime = new Date();
                    var value = { x: lastX, y: lastY, z: lastZ };
                    console.log('Shake!', value)
                    observer.next({
                        name: 'Input:Shake',
                        value: value
                    });
                }

                lastX = 0;
                lastY = 0;
                lastZ = 0;
            }
        });

        console.log('Shake ready!');
    });

}

module.exports = ShakeSensor;