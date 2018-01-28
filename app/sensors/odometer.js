var Rx = require('rxjs');
var i2c = require('i2c');

// Reads distance and current speed from ATTINY85 using I2C
// ...
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

// TEST: require('./app/sensors/odometer')().subscribe(console.log);

var address = 0x13;
var refreshDelay = 1000;
var errorRefreshDelay = refreshDelay;
var byteRefreshDelay = 10;

function OdometerObservable() {
  return Rx.Observable.create(function (observer) {
    
    var wire = new i2c(address, { device: '/dev/i2c-1' });

    wire.scan((err, data) => {
      if(data && data.indexOf(address) > -1) {
        // address lookup found something!
        internalInit(wire, status => observer.next({ name: 'Odometer', value: status }));
      } else {
        // emit null
        console.log('attiny odometer not found.');
        observer.next({ name: 'Odometer', value: { speed: 0, distance: -1 }});
      }
    });


  }).share();
}

function internalInit(wire, callback) {
  var buffer = [];
  function continuousRead(callback) {
    wire.readByte((err, byte) => {
      if(err) {
        console.log('err', err);
        return setTimeout(() => continuousRead(callback), errorRefreshDelay);
      }

      buffer.push(byte);

      // buffer complete?
      var last = buffer.slice(-2);
      if(last[0] === 0x11 && last[1] === 0x22 && buffer.length >= 6) {
        var data = buffer.slice(0, -2);
        buffer = [];

        // emit
        callback({
          speed: (data[0] | (data[1] << 8)) / 100,          // km/h
          distance: (data[2] | (data[3] << 8)) / 1000       // km
        });

        // start reading (again) in...
        setTimeout(() => continuousRead(callback), refreshDelay);
      } else {
        // read next byte
        setTimeout(() => continuousRead(callback), byteRefreshDelay);
      }
    });
  }

  // start
  setTimeout(() =>
    continuousRead(callback),
      refreshDelay);
}


module.exports = OdometerObservable;