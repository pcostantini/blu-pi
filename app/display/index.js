var _ = require('lodash');
var GFX = require('edison-ssd1306/src/Adafruit_GFX');
var hotswap = require('hotswap');

var Displays = [
	require('./screensaver'),
	require('./map'),
	require('./distance')];

var width = 128;
var height = 64;

function DisplayBootstrap(Driver, events) {

	var driver = _.extend(
	  new GFX(height, width),     // invert size since oled is rotated 90'C
	  new Driver(width, height));

	// cycle screen when Next is pressed
	events
		.filter(s => s.name === 'Input:Next')
		.subscribe(cycle);

	// recycle on module change
	hotswap.on('swap', () => {
		current = NewCurrent();
	});


	// get new screen proc (dispose previous)
	var current = null;
	var currentIx = 0;
	function NewCurrent() {
		if(current)
			current.dispose();
		
		var DisplayType = Displays[currentIx];
		console.log('Cycling Screen', currentIx);
		current =  new DisplayType(driver, events);
		currentIx++;
		if(currentIx > Displays.length - 1) currentIx = 0;

		return current;
	}

	// cycle screen
	function cycle() {
		if(current) {
			var isSubscreen = current.cycle && current.cycle();
			if(isSubscreen) {
				console.log('Cycling SubScreen');
				return;
			}
		}
		
		current = NewCurrent();
	}

	// give some time for the OLED reset proc.
	setTimeout(cycle, 250);

}

module.exports = DisplayBootstrap;