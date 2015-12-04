// TEMP
var temp = require("pi-temperature");
// var rx = ...
// var tempStream = rx...
setInterval(function readTempAndEmit() {

	// temp.measure(tempStream.emit);
	temp.measure(function(temp)
	{
	    console.log("It's " + temp + " celsius!");
	});
}, 5000);

// GPS
var GPS = require('gps')
var gps = new GPS();
gps.on('location', function(data) {
  console.log(data);
});

// INPUT:
/*
var gpio = require('rpi-gpio');
gpio.on('change', function(channel, value) {
    console.log('Channel ' + channel + ' value is now ' + value);
});
gpio.setup(16, gpio.DIR_IN, gpio.EDGE_RISING);
*/


var Gpio = require('onoff').Gpio;
var reed = new Gpio(2, 'in', 'both');
reed.watch(function (err, value) {
    console.log(value);
});

process.on('SIGINT', function () {
    reed.unexport();
    process.exit();
});


/*
// BT
var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();

btSerial.on('found', function(address, name) {
    btSerial.findSerialPortChannel(address, function(channel) {
        btSerial.connect(address, channel, function() {
            console.log('connected');

            btSerial.write(new Buffer('my data', 'utf-8'), function(err, bytesWritten) {
                if (err) console.log(err);
            });

            btSerial.on('data', function(buffer) {
                console.log(buffer.toString('utf-8'));
            });
        }, function () {
            console.log('cannot connect');
        });

        // close the connection when you're ready
        btSerial.close();
    }, function() {
        console.log('found nothing');
    });
});

btSerial.inquire();




*/
