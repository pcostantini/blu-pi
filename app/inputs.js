var gpio = require('./gpios');

module.exports = function() {
	var inputBack = gpio.readPin(18, 0).select(as(-1));
	var inputNext = gpio.readPin(27, 0).select(as( 0));
	var inputOk = gpio.readPin(25, 0).select(as(1));
	var inputs = Rx.Observable.merge([ inputBack, inputNext, inputOk ]);

	return inputs;
}

function as(inputValue) {
  return function(e) {
    return {
      input: inputValue
    };
  };
}


