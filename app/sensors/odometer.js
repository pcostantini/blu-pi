var Rx = require('rxjs');
var i2c = require('i2c');

// Reads distance and current speed from ATTINY85 using I2C

var address = 0x13;
var refreshDelay = 1000;
var byteRefreshDelay = 10;

function OdometerObservable() {
  return Rx.Observable.create(function (observer) {
    var buffer = [];
    var wire = new i2c(address, { device: '/dev/i2c-1' });

    function continuousRead(callback) {
      wire.readByte((err, byte) => {
        if(err) {
          console.log('err', err);
          setTimeout(() => continuousRead(callback), refreshDelay);
        } else {
          buffer.push(byte);
          var last = buffer.slice(-2);
          if(last[0] === 0x11 && last[1] === 0x22) {
            // sequence complete
            var data = buffer.slice(0, -2);
            buffer = [];
            callback({
              speed: (data[0] | (data[1] << 8)) / 100,          // km/h
              distance: (data[2] | (data[3] << 8)) / 1000       // km
            });

            // read again in...
            setTimeout(() => continuousRead(callback), refreshDelay);
          } else {
            // read next byte
            setTimeout(() => continuousRead(callback), byteRefreshDelay);
          }
        }
      });
    }

    // read continuously and emit
    continuousRead(status => observer.next({ name: 'Odometer', value: status }));

  });
}

module.exports = OdometerObservable;