var SSD1306 = require('./ssd1306.js');

function Lcd(width, height) {
	var lcd =  new SSD1306();
  	lcd.init();
	return lcd;
}

module.exports = Lcd;