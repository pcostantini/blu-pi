module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');

var width = 64;
var height = 128;

function AveragesDisplay(driver, events, stateStore) {
  // noisyFilter(driver);
  BaseDisplay.call(this, driver, events, stateStore);

  var i = 3;
  this.averageSubject = events.filter(s => s.name.indexOf('Average_1') === 0)
    .subscribe(buf => {
      driver.drawPixel(1, ++i, true);
    });

  // subscribe to events
  // filter only Average_*
  // on each request, ssave to "invisible"" buffer

  // ? have timer, each N seconds to redraw all
  // buffer???
}

inherits(AveragesDisplay, BaseDisplay);

AveragesDisplay.prototype.dispose = function () {
  this.averageSubject.unsubscribe();
}

AveragesDisplay.prototype.init = function (driver, stateStore) {
}

AveragesDisplay.prototype.cycle = function (driver, stateStore) {
  return false; // no state or path ready ?
};


// export
module.exports = AveragesDisplay;