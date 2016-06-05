var _ = require('lodash');
var GFX = require('edison-ssd1306/src/Adafruit_GFX');
var hotswap = require('hotswap');

var Displays = [
	require('./tetris'),
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
		.filter(s => (!!current && !current.rerouteInput))
		.filter(s => s.name === 'Input:C')
		.subscribe(() => nextScreen());

	events
		.filter(s => (!!current && !current.rerouteInput))
		.filter(s => s.name === 'Input:A')
		.subscribe(() => previousScreen());

	// recycle on module change
	hotswap.on('swap', () => {
		current = loadScreen(currentIx);
	});


	// get new screen proc (dispose previous)
	var currentIx = 0;
	var current = null;
	function loadScreen(ix) {
		if (current) {
			current.dispose();
		}

		var DisplayType = Displays[ix];
		console.log('Cycling Screen', ix);
		driver.drawPixel = driver._drawPixel;
		current = new DisplayType(driver, events, stateStore);

		console.log('rerouting input?', current.rerouteInput)

		return current;
	}

	// cycle
	function previousScreen() {
		currentIx--;
		if (currentIx < 0) currentIx = currentIx = Displays.length - 1;
		loadScreen(currentIx);
	}
	function nextScreen() {
		currentIx++;
		if (currentIx > Displays.length - 1) currentIx = 0;
		loadScreen(currentIx);
	}

	// give some time for the OLED reset proc.
	setTimeout(() => loadScreen(0), 250);

}

module.exports = DisplayBootstrap;