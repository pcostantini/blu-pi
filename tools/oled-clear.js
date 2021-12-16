var SSD1306 = require('../app/display/drivers/ssd1306.js');
var GPIO = require('onoff').Gpio;
var resetPins = [4, 24];

// Reset oled through pin
resetPins.forEach((resetPin) => {
    console.log('..reseting oled @ pin ' + resetPin);
    var reset = new GPIO(resetPin, 'out');
    reset.setDirection('high');
    setTimeout(() => reset.setDirection('low'), 14);
    setTimeout(() => reset.setDirection('high'), 33);
});