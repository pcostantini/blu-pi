var gpio = require('./gpios');
var Rx = require('rx');

module.exports = function GpioInputs() {
  var inputNext = gpio.readPin(17, 0).select(() => ({ name: 'Input:Next' }));
	return Rx.Observable.merge([ inputNext/*, inputBack, inputOk*/ ])
		.share();
}