var Displays = [
	require('./distance'),
	require('./map'),
	require('./screensaver')];

function Init(driver, eventsStream, state) {

	// cycle screen when Next is pressed
	eventsStream
		.filter(s => s.name === 'Input:Next')
		.subscribe(cycle);

	// cycle screen
	var current = null;
	var i = 0;
	function cycle() {
		if(current) current.dispose();
		current = new Displays[i](driver, eventsStream, state);

		i++;
		if(i > Displays.length - 1) i = 0;
	}

	// give some time for the OLED reset proc.
	setTimeout(cycle, 250);

}

module.exports = Init;