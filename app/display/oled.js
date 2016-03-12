var SSD1306 = require('./ssd1306.js');
var exitHook = require('exit-hook');

function Oled(width, height) {
  var oled =  new SSD1306();
  oled.init();

  exitHook(function () {
    // TODO: cleanup subscriptions to streams
    console.log('OLED:CLEANUP');
    oled.clear();
    oled.display();
  });

  return oled;
}

module.exports = Oled;