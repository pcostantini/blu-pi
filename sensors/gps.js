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

    listener.connect(function() {
      listener.watch();
    });

    listener.on('TPV', function (tpv) {
      observer.onNext({ name: 'GPS', value: tpv });
    });

    // initial state, null
    observer.onNext({ name: 'GPS', value: null });

    // var clean = false;
    // CleanUp(function () {
    //   if(clean) return;
    //   clean = true;
    //   console.log('CLEANUP:GPS', new Date().getTime());
    //   listener.unwatch();
    // });
  });
}

module.exports = GPS;