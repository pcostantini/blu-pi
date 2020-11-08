var i2c = require('i2c');
var address = 0x13;
var wire = new i2c(address, { device: '/dev/i2c-1' }); // point to your i2c address, debug provides REPL interface

// Data to transfer
// We are reading byte to byte, so we need a way to mark the end/start of each "byte stream"
// volatile uint8_t i2c_regs[] =
// {
//   0x00,   // speed low byte
//   0x00,   // speed high byte
//   0x00,   // distance low byte
//   0x00,   // distance high byte
//   0x11,   // this two mark the end
//   0x22
// };

var buffer = [];
function readData(callback) {
	//wire.readBytes(0xff, 4, function (err, res) {
	wire.readByte(function (err, byte) {
		// result contains a buffer of bytes
		if(err) {
			console.log('err!', err);
			console.log('retry...', err);
			setTimeout(() => readData(callback), 1000);
		} else {
			buffer.push(byte);
			console.log('readBytes', byte);
			var last = buffer.slice(-2);
			if(last[0] === 0x11 && last[1] === 0x22) {
				// sequence complete
				var data = buffer.slice(0, -2);
				buffer = [];
				callback({
					speed: (data[0] | (data[1] << 8)) / 10,
					distance: (data[2] | (data[3] << 8)) / 1000       // meters
				});
				
				setTimeout(() => readData(callback), 1000);
			} else {
				setTimeout(() => readData(callback), 10);
			}
		}
	});
}

readData(console.log);