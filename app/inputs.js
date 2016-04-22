var gpio = require('./gpios');
var Rx = require('rxjs');

module.exports = function GpioInputs() {
  var inputNext = gpio.readPin(17, 0).map(() => ({ name: 'Input:Next' }));
	return Rx.Observable.merge(inputNext/*, inputBack, inputOk*/)
		.share();
}