var _ = require('lodash');
var GFX = require('edison-ssd1306/src/Adafruit_GFX');
var hotswap = require('hotswap');

var Displays = [
	require('./screensaver'),
	require('./map'),
	require('./distance'),
	require('./menu')];

var width = 128;
var height = 64;

function DisplayBootstrap(Driver, events, stateStore) {

	var driver = _.extend(
	  new GFX(height, width),     // invert size since oled is rotated 90'C
	  new Driver(width, height));

	driver._drawPixel = driver.drawPixel;

	// cycle screen when Next is pressed
	events
		.filter(s => s.name === 'Input:Display')
		.subscribe(cycle);

	// recycle on module change
	hotswap.on('swap', () => {
		currentIx--;
		current = NewCurrent();
	});


	// get new screen proc (dispose previous)
	var current = null; 
	var currentIx = 0;
	function NewCurrent() {
		if(current) 
			current.dispose();
		
		if(currentIx < 0 || currentIx > Displays.length - 1) currentIx = 0;
		var DisplayType = Displays[currentIx];
		console.log('Cycling Screen', currentIx);
		driver.drawPixel = driver._drawPixel;
		current =  new DisplayType(driver, events, stateStore);
		currentIx++;

		return current;
	}

	// cycle screen
	function cycle() {
		// if(current) {
		// 	var isSubscreen = !!(current.cycle && current.cycle(driver, stateStore));
		// 	if(isSubscreen) {
		// 		console.log('Cycling SubScreen');
		// 		return;
		// 	}
		// }
		
		current = NewCurrent();
	}

	// give some time for the OLED reset proc.
	setTimeout(cycle, 250);

}

module.exports = DisplayBootstrap;