var lsm303 = require('../app/sensors/lsm303');

var lsm303_stream = lsm303({
    acceleration: 10,
    //   axes: 100,
    //   heading: 500
    //temp: 5000
});

var options = {
    threshold: Math.PI * 2,
    timeout: 500
};

lastTime = new Date();

// accelerometer values
lastX = null;
lastY = null;
lastZ = null;

function deviceMotion(e) {
    var current = e.value;

    var x = Math.abs(current.x);
    var y = Math.abs(current.y);
    var z = Math.abs(current.z);

    lastX = lastX + x;
    lastY = lastY + y;
    lastZ = lastZ + z;

    if (lastX >= options.threshold ||
        lastY >= options.threshold) {
        // if (deltaX > options.threshold) {
        // 	activedEventName = 'shake-x-positive';
        // } else if (-deltaX > options.threshold) {
        // 	activedEventName = 'shake-x-negative';
        // } else if (deltaY > options.threshold) {
        // 	activedEventName = 'shake-y-positive';
        // } else if (-deltaY > options.threshold) {
        // 	activedEventName = 'shake-y-negative';
        // } else if (deltaZ > options.threshold) {
        // 	activedEventName = 'shake-z-positive';
        // } else if (-deltaZ > options.threshold) {
        // 	activedEventName = 'shake-z-negative';
        // }

        var currentTime = new Date();
        var timeDifference = currentTime.getTime() - lastTime.getTime();

        if (timeDifference > options.timeout) {
            // window.dispatchEvent(events[eventNames.indexOf(activedEventName)]);
            lastTime = new Date();
            console.log('shake', { x: lastX, y: lastY, z: lastZ });
        }

        lastX = 0;
        lastY = 0;
        lastZ = 0;
    }
}



lsm303_stream.subscribe(deviceMotion);
console.log('ready?...');