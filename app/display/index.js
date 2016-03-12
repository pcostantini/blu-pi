var _ = require('underscore');
var exitHook = require('exit-hook');

var refreshDisplayDelay = 1000;
var width = 128;
var height = 64;

const mpsTokph = (mps) => Math.round(mps * 3.6 * 100) / 100;

module.exports = function Display(eventsStream) {

  var lcd = Lcd(width, height);
  lcd.clear();

  var bit = false;
  eventsStream.subscribe((s) => {
    try {
      switch(s.name) {
        case 'CpuLoad':
          drawCpu(lcd, s.value);
          break;

        case 'Ticks':
          bit = !bit;
          drawBackground(lcd);
          drawBit(lcd, bit);
          break;

        case 'Gps':
          var speed = s.value.speed;
          if(speed == undefined) speed = 0;
          var kph = mpsTokph(speed);
          var sKph = toFixed(kph, 2); 

          lcd.write('c', true)
          console.log(sKph);

          break;
      }
    } catch(err) {
      console.log('lcd.draw.err!', { err: err, stack: err.stack });
    }
  });

  // refresh screen
  (function redraw() {
    lcd.display();
    setTimeout(redraw, refreshDisplayDelay);
  })();

  exitHook(function () {
    // TODO: cleanup subscriptions to streams
    console.log('CLEANUP:LCD');
    if(lcd) {
      lcd.clear();
      lcd.display();
    }
  });

  // graph functions
  function drawBit(lcd, bit) {
    lcd.fillRect(124, 60, 4, 4, bit ? 1 : 0);
  }

  function drawCpu(lcd, cpuState) {
    lcd.fillRect(0, 0, 4, height, true);
    var cpu = cpuState[0] < 2 ? cpuState[0] : 2;
    var cpuWidth = Math.round((height / 2) * (2-cpu));
    lcd.fillRect(1, 1, 2, cpuWidth, false);
  }

  function drawBackground(lcd) {
    lcd.fillRect(4, 0, 124, 64, false);
    lcd.drawCircle(92, height/2, getRandomArbitrary(), true);
    lcd.drawLine(4, getRandomArbitrary(), 127, getRandomArbitrary(), true);
    lcd.drawLine(4, getRandomArbitrary(), 127, getRandomArbitrary(), true);
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