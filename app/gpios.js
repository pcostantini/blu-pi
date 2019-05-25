'use strict';

var Rx = require('rxjs');
var rpio = require('rpio');

rpio.init({ mapping: 'gpio' });

module.exports.observe = function observe(gpioPin) {
  return Rx.Observable.create(function (observer) {

    try {
      // . console.log('Registering GPIO #' + gpioPin);
      rpio.open(gpioPin, rpio.INPUT, rpio.POLL_BOTH);
      rpio.poll(gpioPin, () => {
        var state = rpio.read(gpioPin) ? 'up' : 'down';
        observer.next({ pin: gpioPin, value: state });
      });
    } catch (err) {
      console.log('gpios.err!', err);
    }

  });
};