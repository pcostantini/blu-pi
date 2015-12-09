var _ = require('lodash');
// var reedSwitchPin = 2;
// var inputs = require('./gpios')
//     .readAllPins([reedSwitchPin, 16, 20, 21]);

// ?

// INPUT:
/*
var gpio = require('rpi-gpio');
gpio.on('change', function(channel, value) {
    console.log('Channel ' + channel + ' value is now ' + value);
});
gpio.setup(16, gpio.DIR_IN, gpio.EDGE_FALLING);
*/

/*
var odometerPin = 2;
var odomoter = require('./odometer')(odometerPin);
*/

// pins
// GPS
/*
var gps = new GPS();
gps.on('location', function(data) {
  console.log(data);
});*/


// OLED
var OLED = require('./oled-js-pi');
var font = require('oled-font-5x7');

var opts = {
  width: 128,
  height: 64,
  address: 0x3D,
  device: '/dev/i2c-1'
};
 
var oled = new OLED(opts);
oled.dimDisplay(true);
oled.turnOnDisplay();
oled.clearDisplay();
oled.update();

var values = {
	temp: 0,
	time: '',
	cpu: 0
}

// cpu temp
var cpuTemp = require('./cpu_temperature')();
cpuTemp.emitter.onChange = function(temp) {
	update({ temp: temp });
}

// cpu load
var os = require('os');
setInterval(function() {
	update({ cpu: os.loadavg()[0] });
}, 5000);

// clock
function getTime() {
	return new Date().toLocaleTimeString();
}
var lastValue = getTime();
setInterval(function() {
	var value = getTime();
	if(lastValue != value) {
		lastValue = value;
		update({ time: value });
	}
}, 1000);

function update(newValues) {
	values = _.extend(values, newValues);
}

var redrawTimer = setInterval(function() {

	console.log(JSON.stringify(values));

	var status = [
		'TMP:',
		Math.round(values.temp),
		'* | CPU:',
		Math.round(values.cpu * 1000) / 1000 
	].join('');

	var title = [
		values.time
	].join('');

	oled.fillRect(0, 0, 127, 7, 0, false);
	oled.setCursor(0, 0);
	oled.writeString(font, 1, title, false, false);

	oled.fillRect(0, 57, 127, 7, 0, false);
	oled.setCursor(0, 57);
	oled.writeString(font, 1, status, false, false);

	oled.drawLine(0, 9, 127, 9, true, false);
	oled.drawLine(0, 55, 127, 55, true, false);

	oled.update();
	
}, 2000);

//do something when app is closing
process.on('exit', function() {
	clearInterval(redrawTimer);

	if (oled) {
		oled.clearDisplay();
		oled = null;
	}

	process.exit();
});