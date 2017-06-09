var Rx = require('rxjs');
var gpio = require('./gpios');

function GpioInputs() {

  var gpioA = 23;
  var gpioB = 17;
  var gpioC = 27;

  var longPressDelay = 1000;

  // REDEFINE:
  // A: Prev
  // B: Ok, LongOk
  // C: Next

  var inputA = mapInput('A', gpio.observe(gpioA).share());
  var inputB = mapInput('B', gpio.observe(gpioB).share());
  var inputC = mapInput('C', gpio.observe(gpioC).share());

  function mapInput(inputName, gpioObservable) {

    var up = gpioObservable.filter(o => o.value === 'up');  // .skip(1)
    var upOrSecond = (val) => Rx.Observable.merge(Rx.Observable.interval(longPressDelay), up);

    return gpioObservable
        .bufferWhen(upOrSecond)
        .filter(s => s.length > 0)
        .filter(s => s[0].value !== 'up')
        .filter(s => s.length > 0)
        .map(s => ({ name: 'Input:' + (s[s.length-1].value === 'up' ? inputName : 'Long' + inputName) }))
  }

  // merge
  return Rx.Observable
    .merge(
      inputA,
      inputB,
      inputC)
    .share();
}

module.exports = GpioInputs;
