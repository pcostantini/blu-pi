var _ = require('lodash');
var Rx = require('rx');
var free = require('freem');

function FreeM() {
  return Rx.Observable.create(function (observer) {

    // Only emit if values have changed
    var last = null;
    function readAndEmit() {
        free.k(function(err, list) {
            if(!_.isMatch(last, list)) {
                var e = { name: 'Memory', value: list };
                observer.onNext(e);
            }

            last = list;
        });
    }

    setInterval(readAndEmit, 5000);
    readAndEmit();

  });    
}

module.exports = FreeM;
