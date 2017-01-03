var _ = require('lodash');
var GFX = require('edison-ssd1306/src/Adafruit_GFX');
var hotswap = require('hotswap');

var Displays = [
	require('./tetris'),
	require('./menu')];

var width = 128;
var height = 64;

function DisplayBootstrap(Driver, events, stateStore) {

	var driver = _.extend(
	  new GFX(height, width),     // invert size since oled is rotated 90'C
	  new Driver(width, height));

	driver._drawPixel = driver.drawPixel;

	// cycle screen when Next is pressed
	var rerouting = false;
	events
		.filter(s => (!rerouting))
		.filter(s => s.name === 'Input:Next')
		.subscribe(cycle);

	// recycle on module change
	hotswap.on('swap', () => {
		currentIx--;
		current = nextScreen();
	});


	// get new screen proc (dispose previous)
	var current = null; 
	var currentIx = 0;
	function nextScreen() {
		if(current) 
			current.dispose();
		
		if(currentIx < 0 || currentIx > Displays.length - 1) currentIx = 0;
		var DisplayType = Displays[currentIx];
		console.log('Cycling Screen', currentIx);
		driver.drawPixel = driver._drawPixel;
		current =  new DisplayType(driver, events, stateStore);
		currentIx++;
		rerouting = current.rerouteInput;
		console.log('rerouting', rerouting)

		return current;
	}

	// cycle screen
	function cycle() {
		current = nextScreen();
	}

	// give some time for the OLED reset proc.
	setTimeout(cycle, 250);

}

module.exports = DisplayBootstrap;