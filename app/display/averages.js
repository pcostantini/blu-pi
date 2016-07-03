module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');

var width = 64;
var height = 128;

function AveragesDisplay(driver, events, stateStore) {
  BaseDisplay.call(this, driver, events, stateStore);
 
  var i = 3;


  this.averageSubject = events
    .filter(s => s.name === 'AverageGraphs')
    .subscribe((graphs) => {
      driver.clear();
      var sample = graphs.value.Average_1_CpuLoad;
      sample.forEach((row, ix) => {
        driver.drawLine(0, ix, row[1], true);
      });
      // driver.drawPixel(Math.round(i/10) + 1, ++i, 1);
    });

  // this.averageSubject = events.filter(s => s.name.indexOf('Average_1') === 0)
  //   .subscribe(buf => {
  //     conso
  //   });

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


// export
module.exports = AveragesDisplay;