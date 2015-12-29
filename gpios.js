var GPIO = require('onoff').Gpio;
var Rx = require('rx');

// TODO: convert to single stream
function readAllPins(pins) {
  if(!pins) return [0];
  return pins.map(readPin);
}

function readPin(gpioPin, respondOnValue) {
  return Rx.Observable.create(function (observer) {

    var reed = new GPIO(gpioPin, 'in', 'both');
    reed.watch(function (err, value) {
        if(err) {
           throw err;
        }

	if(respondOnValue === undefined || value === respondOnValue) {
          observer.onNext({ "pin": gpioPin, "value": value });
        }

    });

  });
}

module.exports = {
  readAllPins: readAllPins,
  readPin: readPin
};
