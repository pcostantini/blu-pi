var Rx = require('rx');
var gpsd = require('node-gpsd');

function GPS() {
  return Rx.Observable.create(function (observer) {
    
    'use strict';
    var listener = new gpsd.Listener({
      port: 2947,
      hostname: 'localhost',
      logger:  {
        info: function() {},
        warn: console.warn,
        error: console.error
      },
      parse: true
    });

    listener.on('TPV', function (tpv) {
      observer.onNext({ name: 'GPS', value: tpv });
    });

    listener.connect(function() {
      listener.watch();
    });

    // cleanup
    process.on('exit', function() {
      console.log('CLEANUP:GPS');
      listener.unwatch();
    });

    observer.onNext({ name: 'GPS', value: null });
  });
}

module.exports = GPS;