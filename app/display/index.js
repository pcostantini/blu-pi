var exitHook = require('exit-hook');

var refreshDisplayDelay = 1000;
var width = 128;
var height = 64;

const mpsTokph = (mps) => Math.round(mps * 3.6 * 100) / 100;

module.exports = function Display(driver, eventsStream) {

  driver.clear();

  var bit = false;
  eventsStream.subscribe((s) => {
    try {
      switch(s.name) {
        case 'CpuLoad':
          drawCpu(driver, s.value);
          break;

        case 'Ticks':
          bit = !bit;
          drawBackground(driver);
          drawBit(driver, bit);
          break;

        case 'Gps':
          var speed = s.value.speed;
          if(speed == undefined) speed = 0;
          var kph = mpsTokph(speed);
          var sKph = toFixed(kph, 2); 

          // driver.write('c', true)
          console.log(sKph);

          break;
      }
    } catch(err) {
      console.log('driver.draw.err!', { err: err, stack: err.stack });
    }
  });

  // refresh screen
  (function redraw() {
    driver.display();
    setTimeout(redraw, refreshDisplayDelay);
  })();

  exitHook(function () {
    // TODO: cleanup subscriptions to streams
    console.log('CLEANUP:driver');
    if(driver) {
      driver.clear();
      driver.display();
    }
  });

  // graph functions
  function drawBit(driver, bit) {
    driver.fillRect(124, 60, 4, 4, bit ? 1 : 0);
  }

  function drawCpu(driver, cpuState) {
    driver.fillRect(0, 0, 4, height, true);
    var cpu = cpuState[0] < 2 ? cpuState[0] : 2;
    var cpuWidth = Math.round((height / 2) * (2-cpu));
    driver.fillRect(1, 1, 2, cpuWidth, false);
  }

  function drawBackground(driver) {
    driver.fillRect(4, 0, 124, 64, false);
    driver.drawCircle(92, height/2, getRandomArbitrary(), true);
    driver.drawLine(4, getRandomArbitrary(), 127, getRandomArbitrary(), true);
    driver.drawLine(4, getRandomArbitrary(), 127, getRandomArbitrary(), true);
  }

  function getRandomArbitrary() {
    return Math.random() * (55 - 9) + 9;
  }

  function toFixed(value, precision) {
      var precision = precision || 0,
          power = Math.pow(10, precision),
          absValue = Math.abs(Math.round(value * power)),
          result = (value < 0 ? '-' : '') + String(Math.floor(absValue / power));

      if (precision > 0) {
          var fraction = String(absValue % power),
              padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');
          result += '.' + padding + fraction;
      }
      return result;
  }

}