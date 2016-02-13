var _ = require('underscore');
var exitHook = require('exit-hook');
var SSD1306 = require('./ssd1306.js');
var AFGFX = require('./Adafruit_GFX.js');

var wait = 5000;
var width = 128;
var height = 64;

var lcd = _.extend(new SSD1306(), new AFGFX(width, height));
lcd.init();

module.exports = function Display(sensorStream, stateStream) {

  lcd.clear();
  lcd.display();

  var axis = {x:0,y:0,z:0};
  var accel = 0;
  sensorStream.subscribe(e => {
    if(e.name === 'MagnometerAxis') {
      axis = e.value;
    }
  });

  function drawAxis(lcd) {

    function getW(axisValue) {
      return Math.ceil(Math.abs(axisValue) / 2);
    }

    lcd.clear();

    drawBackground(lcd);

    lcd.fillRect(0, 0, 128, 7, false);
    lcd.drawLine(0, 1, getW(axis.x), 1, true);
    lcd.drawLine(0, 3, getW(axis.y), 3, true);
    lcd.drawLine(0, 5, getW(axis.z), 5, true);

    lcd.display();
  }

  exitHook(function () {
    if(lcd) {
      lcd.clear();
      lcd.display();
    }
  });

  // redraw loop
  (function redraw() {
    drawAxis(lcd);
    setTimeout(redraw, wait);
  })();

  function drawBackground(lcd) {
    lcd.drawCircle(42, height/2, getRandomArbitrary(), true);
    lcd.drawLine(0, getRandomArbitrary(), 127, getRandomArbitrary(), true);
    lcd.drawLine(0, getRandomArbitrary(), 127, getRandomArbitrary(), true);
  }
}

function getRandomArbitrary() {
  return Math.random() * (55 - 9) + 9;
}