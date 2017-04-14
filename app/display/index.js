var Rx = require('rxjs');
var _ = require('lodash');
var hotswap = require('hotswap');

// TODO: DOCUMENT and credit!
var GFX = require('edison-ssd1306/src/Adafruit_GFX');

var DisplayTypes = [
	require('./overview'),
	require('./map'),
	// require('./screensaver'),
	require('./menu'),
	require('./off')
];

global.displayEvents = Rx.Observable.create((observer) => {
	global.displayEvents_generator = observer;
});

function DisplayBootstrap(nativeDriver, size, events, stateStore) {

	// to the driver, add GFX stuff for eas use
	var driver = _.extend(
		new GFX(size.height, size.width),     // rotate the 'glib' lib
		nativeDriver);

	// cycle screen when Next is pressed
	events
		.filter(s => (!!current && !current.rerouteInput))
		.filter(s => s.name === 'Input:LongC')
		.subscribe(() => nextScreen());

	events
		.filter(s => (!!current && !current.rerouteInput))
		.filter(s => s.name === 'Input:LongA')
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

	global.displayEvents.subscribe((t) => {
		if (t.type === 'change_display') {
			var DisplayType = t.displayType;

			if (current) {
				current.dispose();
			}

			current = new DisplayType(driver, events, stateStore);
		}

		console.log('display_event:', t);
	});

	// give some time for the OLED reset proc.
	setTimeout(() => loadScreen(0), 250);

}

module.exports = DisplayBootstrap;