module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var DottedFilter = require('./dotted-filter');

var width = 64;
var height = 128;

function AveragesDisplay(driver, events, stateStore) {
  BaseDisplay.call(this, driver, events, stateStore);
  // this.averageSubject = events
  //   .filter(s => s.name === 'AverageGraphs')
  //   .subscribe((graphs) => {
  //     drawSample(driver, graphs.value.Average_1_CpuLoad, 0);
  //     drawSample(driver, graphs.value.Average_13_CpuLoad, 10);
  //     drawSample(driver, graphs.value.Average_21_CpuLoad, 20);
  //     drawSample(driver, graphs.value.Average_34_CpuLoad, 30);
  //   });
}
inherits(AveragesDisplay, BaseDisplay);

// AveragesDisplay.prototype.dispose = function () {
// this.averageSubject.unsubscribe();
// }

AveragesDisplay.prototype.init = function (driver, stateStore) {
  drawAll(driver, stateStore.getState().AverageGraphs);
}

AveragesDisplay.prototype.processEvent = function (driver, e, stateStore) {

  switch (e.name) {
    case 'AverageGraphs':
      console.log('! !@F@#$$#AEABVVVEGGGRG');
      var graphs = e.value;
      drawAll(driver, graphs);
      break;
  }
}

// draw
var drawAllThrotlled = _.throttle(function (driver, graphs) {
  drawSample(driver, graphs.Average_1_CpuLoad, 0);
  drawSample(driver, graphs.Average_13_CpuLoad, 10);
  drawSample(driver, graphs.Average_21_CpuLoad, 20);
  drawSample(driver, graphs.Average_34_CpuLoad, 30);
}, 1000);
function drawAll(driver, graphs) {
  drawAllThrotlled(driver, graphs)
}

function drawSample(driver, sample, xOffset) {
  if (!sample) return;

  driver.fillRect(xOffset, 4, sample[0][0], sample.length, false);

  sample.forEach((row, ix) => {
    if(ix === 0) return;

    var filter = null;
    if(row[1] == 0) {
      filter = DottedFilter(driver);
    }

    driver.drawLine(xOffset, ix + 4, xOffset + row[1], ix + 4, true);

    if(filter) {
      filter.dispose();
    }
  });
}

// export
module.exports = AveragesDisplay;