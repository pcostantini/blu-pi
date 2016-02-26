var _ = require('underscore');
var exitHook = require('exit-hook');
var SSD1306 = require('./ssd1306.js');
var AFGFX = require('./Adafruit_GFX.js');

var wait = 750;
var width = 128;
var height = 64;

module.exports = function Display(sensorStream, stateStream) {

  var cpuState = null;
  sensorStream.subscribe(s => {
    if(s.name == 'CpuLoad') {
      cpuState = s.value;
    }
  });

  var lcd = _.extend(new SSD1306(), new AFGFX(width, height));
  lcd.init();
  // lcd.dim(true);
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
  var bit = false;
  (function redraw() {

    bit = !bit;

    // drawBackground(lcd);
    drawCpu(lcd, cpuState);
    drawBit(lcd, bit);
   
    lcd.display();
    setTimeout(redraw, wait);

  })();
}

function drawBit(lcd, bit) {
    lcd.drawPixel(0, 63, bit ? 1 : 0);
}


function drawCpu(lcd, cpuState) {
  
  // clear
  lcd.fillRect(0, 0, 128, 4, true);

  // cpu
  if(cpuState) {
    var cpu = cpuState[0] < 2 ? cpuState[0] : 2;
    var cpuWidth = Math.round((126 / 2) * (2-cpu));
    lcd.fillRect(1, 1, cpuWidth, 2, false);
  }
}

function drawBackground(lcd) {
  lcd.fillRect(0, 5, 128, 64, false);
  lcd.drawCircle(92, height/2, getRandomArbitrary(), true);
  lcd.drawLine(0, getRandomArbitrary(), 127, getRandomArbitrary(), true);
  lcd.drawLine(0, getRandomArbitrary(), 127, getRandomArbitrary(), true);
}

function getRandomArbitrary() {
  return Math.random() * (55 - 9) + 9;
}
