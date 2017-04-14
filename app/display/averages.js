module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var DottedFilter = require('./dotted-filter');
var NoiseFilter = require('./noisy-filter');

function AveragesDisplay(driver, events, stateStore) {
  BaseDisplay.call(this, driver, events, stateStore);
};
inherits(AveragesDisplay, BaseDisplay);


var avgName = 'Average_1'; // TODO: moveout!
var yOffset = 6;
var row = yOffset;
var width = 19;

AveragesDisplay.prototype.processEvent = function (driver, e, stateStore) {
  if (e.name.indexOf(avgName) === 0) {
    // console.log(e.value);

    // bottom drawer
    driver.drawLine(0, row + 1, 64, row + 1, false);
    driver.drawRect(0, row + 2, 64, 2, true);

    // smaples
    drawSampleSample(driver, 22, row, 2.0, e.value['CpuLoad']);
    drawSampleSample(driver, 44, row, 35, e.value['Gps.Speed']);
    drawSampleSample(driver,  0, row, 70, e.value['CpuTemperature']);
    
    // 
    row = row + 1;
    if (row >= 128) row = yOffset;
  }
}

function drawSampleSample(driver, x0, y, max, sample) {
  //if (!sample) return;
  sample = sample || 0;
  var pxWidth = Math.round((width / max) * sample);
  if (pxWidth > width) pxWidth = width;

  var filter = DottedFilter(driver);
  // current bar value (width) -- dotted
  driver.drawLine(x0, y, x0 + pxWidth, y, true, true);
  // bar.max   -- + noisy
  driver.drawPixel(x0 + width + 1, y, true);
  filter.dispose();


  // bar.max   -- + noisy
  // runWithFilter(
  //   driver,
  //   driver => NoiseFilter(driver),
  //   driver => {
  //     driver.drawPixel(x0 + width + 1, y, true);
  //   });


  // bar.tip --d solid
  driver.drawPixel(x0 + pxWidth, y, true);
  driver.drawPixel(x0 + pxWidth, y + 3, false);
}

// draw
function drawAll(driver, graphs) {
  drawAllThrotlled(driver, graphs)
}
var drawAllThrotlled = _.throttle(function (driver, graphs) {

  // ... SAMPLES
  drawSample(driver, graphs.Average_1_CpuLoad, 0);
  drawSample(driver, graphs.Average_1_CpuLoad, 10);
  drawSample(driver, graphs.Average_1_CpuLoad, 20);
  drawSample(driver, graphs.Average_1_CpuLoad, 30);
  //

}, 1000);

function drawSample(driver, sample, xOffset) {
  // console.log('drawSample', sample);
  if (!sample) return;

  driver.fillRect(xOffset, 4, sample[0][0], sample.length, false);

  sample.forEach((row, ix) => {
    if (ix === 0) return;

    var filter = null;
    if (row[1] == 0) {
      filter = DottedFilter(driver);
    }

    driver.drawLine(xOffset, ix + 4, xOffset + row[1], ix + 4, true);

    if (filter) {
      filter.dispose();
    }
  });
}

// export
module.exports = AveragesDisplay;
