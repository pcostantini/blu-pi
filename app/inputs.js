var Rx = require('rxjs');
var gpio = require('./gpios');
var shake = require('./sensors/shake');

function GpioInputs() {

  var longPressDelay = 500;

  var gpioA = 23;
  var gpioB = 17;
  var gpioC = 27;

  // device shaked
  var inputShake = shake();

  // back, go to previous step
  var inputBack = gpio.observe(gpioA).filter(e => e.value === 'up').map(() => ({ name: 'Input:Back' }));

  // cycle screen
  var inputNext = gpio.observe(gpioB).filter(e => e.value === 'up').map(() => ({ name: 'Input:Next' }));

  // Ok and LongOk (long pressing Ok btn)
  function checkOkType(evs) {
    if(evs.length < 2) return 'Ok';
    var delay = new Date().getTime() - evs[evs.length - 1].timestamp;
    return delay > longPressDelay ? 'LongOk' : 'Ok';
  }
  
  var gpioCobserve = gpio.observe(gpioC).share();
  var inputOkAndLongOk = gpioCobserve
    .timestamp()                                                // add ts
    .buffer(gpioCobserve.filter(e => e.value === 'up'))        // take until botton is released
    .map((evs) => ({ name: 'Input:' + checkOkType(evs) }));

  // merge
  return Rx.Observable
    .merge(inputShake, inputNext, inputBack, inputOkAndLongOk)
    .share();
}

module.exports = GpioInputs;
