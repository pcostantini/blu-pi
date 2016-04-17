var gpio = require('./gpios');
var Rx = require('rx');

module.exports = function GpioInputs() {
  return gpio.readPin(17, 0).select(() => ({ name: 'Input:Next' }));
  
	// var inputBack = gpio.readPin(18, 0).select(as(-1));
	// var inputNext = gpio.readPin(17, 0).select(as(0));
	// var inputOk = gpio.readPin(25, 0).select(as(1));
	// var inputs = Rx.Observable.merge([ inputBack, inputNext, inputOk ]);

	// return inputs;
}