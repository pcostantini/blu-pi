var Displays = [
	require('./distance'),
	require('./map')];

function Init(driver, eventsStream, state) {

	// cycle screen when Next is pressed
	eventsStream
		.filter(s => s.name === 'Input:Next')
		.subscribe(cycle);

	// cycle screen
	var current = null;
	var i = 0;
	function cycle() {
		if(current) {
			var isSubscreen = current.cycle && current.cycle();
			if(isSubscreen) {
				console.log('Cycling SubScreen');
				return;
			}
			current.dispose();
		}
		
		console.log('Cycling Screen');
		current = new Displays[i](driver, eventsStream, state);
		i++;
		if(i > Displays.length - 1) i = 0;
	}

	// give some time for the OLED reset proc.
	setTimeout(cycle, 250);

}

module.exports = Init;