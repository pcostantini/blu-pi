var _ = require('underscore');
var exitHook = require('exit-hook');
var Lcd = require('./lcd_web'); // require('./lcd');

var refreshDisplayDelay = 1000;
var width = 128;
var height = 64;

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
      }
    } catch(err) {
      console.log('lcd.draw.err!', err);
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

}