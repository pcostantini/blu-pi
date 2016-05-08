var Rx = require('rxjs');
var gpio = require('./gpios');

function GpioInputs() {
  
  var inputNext = gpio.readPin(16, 0).map(() => ({ name: 'Input:Next' }));
  var inputBack = gpio.readPin(13, 0).map(() => ({ name: 'Input:Back' }));
  var inputOk = gpio.readPin(12, 0).map(() => ({ name: 'Input:Ok' }));

  return Rx.Observable
    .merge(inputNext, inputBack, inputOk)
    .share();
}

module.exports = GpioInputs;
