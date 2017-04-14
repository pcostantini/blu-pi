module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var DottedFilter = require('./dotted-filter');
var NoiseFilter = require('./noisy-filter');

function AveragesDisplay(driver, events, stateStore) {
  BaseDisplay.call(this, driver, events, stateStore);
  drawLabel(driver, currentGroup.label, currentAverageSet);
};
inherits(AveragesDisplay, BaseDisplay);


var yOffset = 6;
var row = yOffset;
var width = 19;

var currentAverageStep = 1;
var currentAverageSet = 'Average_' + currentAverageStep;
var currentGroup = {
  label: 'SYS',
  layout: [
    ['CpuTemperature', 70],
    ['CpuLoad', 2.0],
    ['Gps.Speed', 35]
  ]
};

var steps = [1, 3, 5, 8, 13, 21, 34];
function NextStep() {
  var ix = steps.indexOf(currentAverageStep);
  currentAverageStep = steps[ix + 1];
  if (!currentAverageStep) currentAverageStep = steps[0];
  currentAverageSet = 'Average_' + currentAverageStep;
}

AveragesDisplay.prototype.processEvent = function (driver, e, stateStore) {
  if (e.name.indexOf(currentAverageSet) === 0) {

    // Average event

    // bottom drawer
    driver.drawLine(0, row + 1, 64, row + 1, false);
    driver.drawRect(0, row + 2, 64, 2, true);
    driver.drawRect(0, row + 4, 64, 2, false);

    // 3 col samples
    drawSampleSample(driver, 0, row, e.value[currentGroup.layout[0][0]], currentGroup.layout[0][1]);
    drawSampleSample(driver, 22, row, e.value[currentGroup.layout[1][0]], currentGroup.layout[1][1]);
    drawSampleSample(driver, 44, row, e.value[currentGroup.layout[2][0]], currentGroup.layout[2][1]);
    // ...

    // re-draw label
    if (row === yOffset) {
      drawLabel(driver, currentGroup.label, currentAverageSet);
    }

    row = row + 1;

    // mve drawer up
    if (row >= 120) row = yOffset;
  } else if (e.name === 'Input:B') {

    // Change Frequency

    driver.drawLine(0, row, 64, row, false);
    driver.drawLine(0, row + 1, 64, row + 1, true);
    row += 1;

    NextStep();
    drawLabel(driver, currentGroup.label, currentAverageSet);
  }
}

function drawLabel(driver, label, step) {
  // clear
  driver.fillRect(0, 125, 64, 3);
  // label
  driver.drawRect(0, 122, 64, 1, false);
  driver.setTextSize(1);
  driver.setTextColor(1, 0);
  driver.setTextWrap(false);
  var x = Math.floor((64 - label.length * 6)) + 1;
  // centered: var x = Math.floor((64 - label.length * 6) / 2);
  driver.setCursor(x, 121);
  write(driver, label);

  // step
  var steps = parseInt(step.split('_')[1], 10);
  var filter = DottedFilter(driver);
  driver.fillRect(0, 125, steps, 3, true);
  filter.dispose();
}

function drawSampleSample(driver, x0, y, sample, max) {
  sample = sample || 0;
  var pxWidth = Math.round((width / max) * sample);
  if (pxWidth > width) pxWidth = width;

  var filter = DottedFilter(driver);
  // current bar value (width) -- dotted
  driver.drawLine(x0, y, x0 + pxWidth, y, true, true);
  // bar.max -- dotted
  driver.drawPixel(x0 + width + 1, y, true);
  filter.dispose();

  // bar.tip -- solid
  driver.drawPixel(x0 + pxWidth, y, true);

  // drawer.tip -- solid black
  driver.drawPixel(x0 + pxWidth, y + 2, false);
  driver.drawPixel(x0 + pxWidth - 1, y + 3, false);
  driver.drawPixel(x0 + pxWidth, y + 3, false);
  driver.drawPixel(x0 + pxWidth + 1, y + 3, false);
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

function write(driver, string) {
  var chars = string.split('');
  chars.forEach((c) => {
    driver.write(c.charCodeAt(0));
  });
}

// export
module.exports = AveragesDisplay;
