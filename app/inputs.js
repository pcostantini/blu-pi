var Rx = require('rxjs');

try {
	var gpio = require('./gpios');
	module.exports = function GpioInputs() {
	  var inputNext = gpio.readPin(17, 0).map(() => ({ name: 'Input:Next' }));
		return Rx.Observable.merge(inputNext/*, inputBack, inputOk*/)
			.share();
	}
} catch(err) {
	console.log('inputs.err!', err);
	module.exports = () => Rx.Observable.empty();
}