var SSD1306 = require('./ssd1306.js');
var GPIO = require('onoff').Gpio;
var exitHook = require('exit-hook');

var resetPins = [4, 24];

function Oled(width, height) {

  // Reset oled through pin
  resetPins.forEach((resetPin) => {
    console.log('reseting oled @ pin ' + resetPin);
    var reset = new GPIO(resetPin, 'out');
    reset.setDirection('high');
    setTimeout(() => reset.setDirection('low'), 20);
    setTimeout(() => reset.setDirection('high'), 50);
  });

  var oled = new SSD1306();
  // oled.init();
  setTimeout(() => oled.init(), 100);

  exitHook(function () {
    console.log('OLED:CLEANUP');
    oled.clear();
    oled.display();
  });

  return oled;
}

module.exports = Oled;