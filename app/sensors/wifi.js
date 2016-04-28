var Rx = require('rxjs');
var wifiscanner = require('node-wifiscanner');

var DefaultReadInterval = 5000;

function Wifi(readInterval) {

  readInterval = readInterval || DefaultReadInterval;

  return Rx.Observable.create((observer) => {

    (function read() {
      wifiscanner.scan((err, data) => {
        if (err) console.log("Wifi.err!", err);

        if (data) {
          observer.next({ name: 'Wifi', value: { length: data.length, nodes: data } });
        }

        setTimeout(read, readInterval);
      });
    })();

  });
}

module.exports = Wifi;