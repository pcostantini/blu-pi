var Rx = require('rxjs');
var gpio = require('./gpios');

function GpioInputs() {
  
  var inputNext = gpio.readPin(17, 0).map(() => ({ name: 'Input:Next', value: Date.now() }));
  // var inputBack = gpio.readPin(?, 0).map(() => ({ name: 'Input:Next', value: Date.now() }));
  // var inputOk = gpio.readPin(?, 0).map(() => ({ name: 'Input:Next', value: Date.now() }));

  return Rx.Observable
    .merge(inputNext/*, inputBack, inputOk*/)
    .share();
}

module.exports = GpioInputs;