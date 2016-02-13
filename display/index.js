var _ = require('underscore');
var exitHook = require('exit-hook');
var SSD1306 = require('./ssd1306.js');
var AFGFX = require('./Adafruit_GFX.js');

var wait = 750;
var width = 128;
var height = 64;

module.exports = function Display(sensorStream, stateStream) {

  var memoryState = null;
  var cpuState = null;
  sensorStream.subscribe(s => {
    if(s.name == 'CpuLoad') {
      cpuState = s.value;
    } else if(s.name == 'Memory') {
      memoryState = s.value;
    }
  });

  var lcd = _.extend(new SSD1306(), new AFGFX(width, height));
  lcd.init();
  lcd.clear();
  lcd.display();

  exitHook(function () {
    // TODO: cleanup subscriptions to streams
    console.log('CLEANUP:LCD');
    if(lcd) {
      lcd.clear();
      lcd.display();
    }
  });

  // draw loop
  (function redraw() {

    drawBackground(lcd);
    drawCpuAndRam(lcd, cpuState, memoryState);
    lcd.display();

    setTimeout(redraw, wait);

  })();
}

function drawCpuAndRam(lcd, cpuState, memoryState) {
  
  // clear
  lcd.fillRect(0, 0, 128, 5, true);

  // cpu
  if(cpuState) {
    var cpu = cpuState[0] < 2 ? cpuState[0] : 2;
    var cpuWidth = Math.round((126 / 2) * (2-cpu));
    lcd.fillRect(cpuWidth, 1, 127 - cpuWidth, 2, false);
  }

  // mem
  if(memoryState) {
    var total = memoryState.heapTotal;
    var free = total - memoryState.heapUsed;
    var freeWidth = Math.round((126 / total) * free);
    lcd.fillRect(freeWidth, 3, 127 - freeWidth, 1, false);
  }

}

function drawBackground(lcd) {
  lcd.fillRect(0, 5, 128, 64, false);
  lcd.drawCircle(42, height/2, getRandomArbitrary(), true);
  lcd.drawLine(0, getRandomArbitrary(), 127, getRandomArbitrary(), true);
  lcd.drawLine(0, getRandomArbitrary(), 127, getRandomArbitrary(), true);
}

function getRandomArbitrary() {
  return Math.random() * (55 - 9) + 9;
}