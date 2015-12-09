
function Temp() {
	// TEMP
	var temp = require("pi-temperature");
	// var rx = ...
	// var tempStream = rx...
	setInterval(function readTempAndEmit() {

	    var lastTemp;
	    temp.measure(function(temp)
	    {
	    	if(lastTemp === temp) return;
	    	lastTemp = temp;

	    	emitter.onChange(temp);

	    	// tempStream.emit...
	   });
	}, 5000);

	return {
		name: 'CPU Temp',
		emitter: emitter
	};
};

var emitter = {
	onChange: function() { }
}

module.exports = Temp;