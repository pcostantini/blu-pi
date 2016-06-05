var Rx = require('rxjs');
var gpio = require('./gpios');
var shake = require('./sensors/shake');

function GpioInputs() {

  var gpioA = 23;
  var gpioB = 17;
  var gpioC = 27;

  var longPressDelay = 500;

  // REDEFINE:
  // A: Prev
  // B: Ok, LongOk
  // C: Next

  var inputA = mapInput('A', gpio.observe(gpioA).share());
  var inputB = mapInput('B', gpio.observe(gpioB).share());
  var inputC = mapInput('C', gpio.observe(gpioC).share());

  function mapInput(inputName, gpioObservable) {

    function checkType(evs) {
      if (evs.length < 2) return inputName;
      var delay = new Date().getTime() - evs[evs.length - 1].timestamp;
      return (delay > longPressDelay ? 'Long' : '') + inputName;
    }
    
    return gpioObservable
      .timestamp()                                                // add ts
      .buffer(gpioObservable.filter(e => e.value === 'up'))        // take until botton is released
      .map((evs) => ({ name: 'Input:' + checkType(evs) }));

  }

  // merge
  return Rx.Observable
    .merge(
        // shake(),
        inputA,
        inputB,
        inputC)
    .share();
}

module.exports = GpioInputs;
