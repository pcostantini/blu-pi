var exitHook = require('exit-hook');
var GPIO = require('onoff').Gpio;

// TODO: extract to config
var resetPins = [4, 24];

function Oled(width, height) {
  console.log('.OledDriver:initing')

  try {

    var SSD1306 = require('./ssd1306.js');

    // Reset oled through pin
    reset(resetPins);

    var oled = new SSD1306();
    setTimeout(() => {
      oled.init();
      oled.dim();
      oled.clear();
      oled.display();
      oled.setRotation(2);
      oled.inited = true;
    }, 55);

    exitHook(function () {
      oled.invert();
    });

    return oled;
    
  } catch (err) {
    console.error('oled.err', err);
  }
}

function reset(resetPins) {
  console.log('.OledDriver:reset');
  resetPins.forEach((resetPin) => {
    console.log('..reseting oled @ pin ' + resetPin);
    var reset = new GPIO(resetPin, 'out');
    reset.setDirection('high');
    setTimeout(() => reset.setDirection('low'), 14);
    setTimeout(() => reset.setDirection('high'), 33);
  });
}

module.exports = Oled;
