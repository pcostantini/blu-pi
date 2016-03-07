var SSD1306 = require('./ssd1306.js');
var AFGFX = require('./Adafruit_GFX.js');

function Lcd(width, height) {
	var lcd =  _.extend(new SSD1306(), new AFGFX(width, height))
  	lcd.init();
	return lcd;
}