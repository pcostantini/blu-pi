var GPIO = require('onoff').Gpio;
var Rx = require('rx');

// TODO: convert to single stream
function readAllPins(pins) {
  if(!pins) return [0];
  return pins.map(readPin);
}

function readPin(gpioPin, respondOnValue) {
  return Rx.Observable.create(function (observer) {

    try {
      var read = new GPIO(gpioPin, 'in', 'both');
      read.watch(function (err, value) {
        if(err) {
           throw err;
        }

        if(respondOnValue === undefined || value === respondOnValue) {
          observer.onNext({ "pin": gpioPin, "value": value });
        }
      });
    } catch(err) {
      console.log('gpios.err!', err);
    }

  });
}

module.exports = {
  readAllPins: readAllPins,
  readPin: readPin
};
