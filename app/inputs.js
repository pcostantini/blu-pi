var Rx = require('rxjs');
var gpio = require('./gpios');

function GpioInputs() {
  
  // back, go to previous step
  var inputBack = gpio.readPin(23, 0).map(() => ({ name: 'Input:Back' }));

  // cycle screen
  var inputNext = gpio.readPin(17, 0).map(() => ({ name: 'Input:Next' }));

  // accept, view more, continue
  var inputOk = gpio.readPin(27, 0).map(() => ({ name: 'Input:Ok' }));

  return Rx.Observable
    .merge(inputNext, inputBack, inputOk)
    .share();
}

module.exports = GpioInputs;
