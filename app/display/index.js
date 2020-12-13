var Rx = require('rxjs');
var _ = require('lodash');
var hotswap = require('hotswap');

// Great convertion of Adafruit GFX ( https://github.com/wballard/edisonedison-ssd1306 )
var GFX = require('./adafruit-gfx');

var DisplayTypes = [
	require('./overview'),
	require('./averages'),
	// require('./map'),
	require('./intervals'),
	// require('./screensaver'),
	require('./off'),
	require('./menu')
];

function DisplayBootstrap(nativeDriver, size, events, stateStore) {

	// to the driver, add GFX stuff for eas use
	var driver = _.extend(
		new GFX(size.height, size.width),     // rotate the 'glib' lib
		nativeDriver);

	// disable text wrapping
	driver.setTextWrap(false);

	// cycle screen when Next is pressed
	events
		.filter(s => current && !current.rerouteInput)
		.filter(s => s.name === 'Input:LongC')
		.subscribe(() => nextScreen());

	events
		.filter(s => current && !current.rerouteInput)
		.filter(s => s.name === 'Input:LongA')
		// .subscribe(() => menuScreen());
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
			console.log('disposing screen!');
			current.dispose();
		}

		var DisplayType = DisplayTypes[ix];
		console.log('Display:Cycling Screen', { ix: ix });

		current = new DisplayType(driver, events, stateStore);
		console.log('..Screen:Input ReRouting:', current.rerouteInput)
		return current;
	}

	// cycle
	function previousScreen() {
		currentIx--;
		if (currentIx < 0) currentIx = currentIx = DisplayTypes.length - 1;
		loadScreen(currentIx);
	}
	function nextScreen() {
		currentIx++;
		if (currentIx > DisplayTypes.length - 1) currentIx = 0;
		loadScreen(currentIx);
	}
	function menuScreen() {
		currentIx = DisplayTypes.length - 1;
		loadScreen(currentIx);
	}

	global.globalEvents
		.filter(t => t.type === 'display_event')
		.subscribe(t => {
			console.log('display_event:', t);
			var DisplayType = t.value;

			var disposed = current ? current.dispose() : false;
			current = new DisplayType(driver, events, stateStore);
		});

	// give some time for the OLED reset proc.
	setTimeout(() => loadScreen(0), 250);

}

module.exports = DisplayBootstrap;