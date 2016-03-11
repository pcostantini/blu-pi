var SSD1306 = require('./ssd1306.js');

function Oled(width, height) {
	var oled =  new SSD1306();
  	oled.init();
	return oled;
}

module.exports = Oled;