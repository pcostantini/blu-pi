module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');

var width = 64;
var height = 128;

function AveragesDisplay(driver, events, stateStore) {
  BaseDisplay.call(this, driver, events, stateStore);

  this.averageSubject = events
    .filter(s => s.name === 'AverageGraphs')
    .subscribe((graphs) => {
      driver.clear();

      drawSample(driver, graphs.value.Average_1_CpuLoad, 0);
      drawSample(driver, graphs.value.Average_13_CpuLoad, 10);
      drawSample(driver, graphs.value.Average_21_CpuLoad, 20);
      drawSample(driver, graphs.value.Average_34_CpuLoad, 30);
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

function drawSample(driver, sample, xOffset) {

  sample.forEach((row, ix) => {
    driver.drawLine(xOffset, ix, xOffset + row[1], ix, true);
  });
}

// export
module.exports = AveragesDisplay;