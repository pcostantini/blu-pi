var SSD1306 = require('./ssd1306.js');
var GPIO = require('onoff').Gpio;
var exitHook = require('exit-hook');

var resetPins = [4, 24];

function Oled(width, height) {
  console.log('.OledDriver:initing')

  // Reset oled through pin
  resetPins.forEach((resetPin) => {
    console.log('..reseting oled @ pin ' + resetPin);
    var reset = new GPIO(resetPin, 'out');
    reset.setDirection('high');
    setTimeout(() => reset.setDirection('low'), 14);
    setTimeout(() => reset.setDirection('high'), 33);
  });

  var oled = new SSD1306();
  setTimeout(() => {
    oled.init();
    oled.clear();
    oled.inited = true;
  }, 55);

  exitHook(function () {
    console.log('.OledDriver:Cleanup');
    // todo: right an exit message =)
    oled.clear();
    oled.display();
  });

  return oled;
}

module.exports = Oled;