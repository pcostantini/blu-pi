var resetPins = [4, 24];

var exitHook = require('exit-hook');

function Oled(width, height) {
  console.log('.OledDriver:initing')

  try {

    var SSD1306 = require('./ssd1306.js');
    var GPIO = require('onoff').Gpio;

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
      oled.clear();
      oled.display();
    });

    return oled;
    
  } catch (err) {
    console.error('oled.err', err);
  }
}

module.exports = Oled;