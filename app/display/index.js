var Displays = [
	require('./map'),
	require('./altitude'),
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

	cycle();

}

module.exports = Init;