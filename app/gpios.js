var Rx = require('rx');
var rpio = require('rpio');

rpio.init({ mapping: 'gpio' });

// TODO: convert to single stream
// function readAllPins(pins) {
//   if(!pins) return [0];
//   return pins.map(readPin);
// }

function readPin(gpioPin, respondOnState) {
  return Rx.Observable.create(function (observer) {

    try {
      console.log('Registering GPIO #' + gpioPin);
      rpio.open(gpioPin, rpio.INPUT, rpio.POLL_BOTH);
      rpio.poll(gpioPin, () => {
        var state = rpio.read(gpioPin) ? 0 : 1;
        if(state === respondOnState) {
          observer.onNext({ 'pin': gpioPin, 'value': state });
        }
      });
    } catch(err) {
      console.log('gpios.err!', err);
    }

  });
}

module.exports = {
  // readAllPins: readAllPins,
  readPin: readPin
};
