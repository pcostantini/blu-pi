var GPIO = require('onoff').Gpio;

function readAllPins(pins) {
	if(!pins) return [0];
	return pins.map(readPin);
}

function readPin(gpioPin) {
	var reed = new GPIO(gpioPin, 'in', 'both');
    reed.watch(function (err, value) {
        if(err) {
           throw err;
        }

        console.log([gpioPin, ':', value].join(''));

        // EMIT!
    });
}

module.exports = {
	readAllPins: readAllPins,
	readPin: readPin
};

