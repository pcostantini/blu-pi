var _ = require('underscore');
var exitHook = require('exit-hook');
var SSD1306 = require('./ssd1306.js');
var AFGFX = require('./Adafruit_GFX.js');

var wait = 750;
var width = 128;
var height = 64;

module.exports = function Display(sensorStream, stateStream) {

  var memoryState = null;
  var cpuState;

  stateStream.subscribe(s => {
    memoryState = s.Memory;
    cpuState = s.CpuLoad;
  });

  var lcd = _.extend(new SSD1306(), new AFGFX(width, height));
  lcd.init();
  lcd.clear();
  lcd.display();


  // cleanup
  exitHook(function () {
    // TODO: cleanup subscriptions to streams
    console.log('CLEANUP:LCD');
    if(lcd) {
      lcd.clear();
      lcd.display();
    }
  });

  // redraw loop
  (function redraw() {
    // if(memoryState) {
    //   drawRam();
    // }

    // if(cpuState) {
    //   drawCpu();
    // }

    if(memoryState && cpuState) {
      drawCpuAndRam();
    }

    drawBackground();

    lcd.display();

    setTimeout(redraw, wait);
  })();

  function drawRam() {
    // clear
    lcd.fillRect(0, 0, 128, 5, true);

    // ram
    var total = memoryState[0].total;
    var free = memoryState[0].free;
    var freeWidth = Math.round((126 / total) * free);
    lcd.fillRect(127 - freeWidth, 1, freeWidth, 2, false);

    // swap
    var total = memoryState[2].total;
    var free = memoryState[2].free;
    var freeWidth = Math.round((126 / total) * free);
    lcd.fillRect(127 - freeWidth, 3, freeWidth, 1, false);
  }

  function drawCpuAndRam() {
    // clear
    lcd.fillRect(0, 0, 128, 5, true);

    // cpu
    var cpu = cpuState[0] < 2 ? cpuState[0] : 2;

    var cpuWidth = Math.round((126 / 2) * (2-cpu));
    lcd.fillRect(127 - cpuWidth, 1, cpuWidth, 2, false);

    // swap
    var total = memoryState[0].total;
    var free = memoryState[0].free;
    var freeWidth = Math.round((126 / total) * free);
    lcd.fillRect(127 - freeWidth, 3, freeWidth, 1, false);
  }

  function drawBackground() {
    lcd.fillRect(0, 5, 128, 64, false);
    lcd.drawCircle(width/2, height/2, getRandomArbitrary(), true);
    lcd.drawLine(0, getRandomArbitrary(), 127, getRandomArbitrary(), true);
    lcd.drawLine(0, getRandomArbitrary(), 127, getRandomArbitrary(), true);
  }
}

function getRandomArbitrary() {
  return Math.random() * (55 - 9) + 9;
}