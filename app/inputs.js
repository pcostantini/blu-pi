var Rx = require('rxjs');
var gpio = require('./gpios');

function GpioInputs() {
  
  var inputNext = gpio.readPin(17, 0).map(() => ({ name: 'Input:Next' }));
  // var inputBack = gpio.readPin(?, 0).map(() => ({ name: 'Input:Next' }));
  // var inputOk = gpio.readPin(?, 0).map(() => ({ name: 'Input:Next' }));

  return Rx.Observable
    .merge(inputNext/*, inputBack, inputOk*/)
    .share();
}

module.exports = GpioInputs;