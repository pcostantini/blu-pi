module.change_code = 1;

// click: cycle step
// long click: redraw
// next: next AVERAGE SCREEN
// prev: prev " "

// smaple seq:
// SYS.* > SYS.CPU_TEMP > SYS.CPU_LOAD > SYS.MEMORY
// SPEED.* > SPEED.odometer > SPEED.gps
// TEMPs Exteral > (template / Magnometor Temp (barometer.pression))


var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var DottedFilter = require('./dotted-filter');
var ScanlinesFilter = require('./scanlines-filter');
var NoiseFilter = require('./noisy-filter');

var offsetY = 5;
var y = offsetY;
var width = 19;
var steps = require('../state').AverageSensorSteps;
var currentAverageStep = steps[2];
var currentAverageSet = 'Average_' + currentAverageStep;
var currentGroup = {
  label: 'SYS',
  layout: [

    // TODO: provide modifier, logaritmic and exponential, allow custom ones...
    ['MagnometerTemperature', 50, 24],
    ['CpuTemperature', 77, 33],
    ['CpuLoad', 1, 0]],

    // ['Gps.speed']
    // ['Odometer.speed']
    // ['Cadence' ]
};

function AveragesDisplay(driver, events, stateStore) {
  this.refreshDisplayDelay = 1000;
  BaseDisplay.call(this, driver, events, stateStore);
}

inherits(AveragesDisplay, BaseDisplay);

function NextStep(driver) {

  y++;
  driver.drawLine(0, y, 64, y, true);

  var ix = steps.indexOf(currentAverageStep);
  currentAverageStep = steps[ix - 1];
  if (!currentAverageStep) currentAverageStep = steps[steps.length - 1];
  currentAverageSet = 'Average_' + currentAverageStep;

  console.log('AverageSet', currentAverageSet)
}

AveragesDisplay.prototype.init = function (driver, stateStore) {

  var state = stateStore.getState() || { Averages: [] };
  var o = state.Averages || [];
  var a = o[currentAverageSet];
  var page = _.takeRight(a, 164 - offsetY);

  drawLabel(driver, currentGroup.label);

  _.forEach(page, function (e, ix) {

    if (y >= 120) y = offsetY;

    // re-draw label
    if (y === offsetY) {
      drawLabel(driver, currentGroup.label);
    }

    var tip = ix === page.length - 1;

    // clear line
    driver.drawLine(0, y, 64, y, false, true);

    if(tip) {
      // bottom drawer
      drawDrawer(driver);
    }

    // 3 col samples
    drawSampleSample(driver, 0, y, e[currentGroup.layout[0][0]], currentGroup.layout[0][1], currentGroup.layout[0][2], tip);
    drawSampleSample(driver, 22, y, e[currentGroup.layout[1][0]], currentGroup.layout[1][1], currentGroup.layout[1][2],tip);
    drawSampleSample(driver, 44, y, e[currentGroup.layout[2][0]], currentGroup.layout[2][1], currentGroup.layout[2][2], tip);

    y = y + 1;
  });

}

function drawDrawer(driver) {
  driver.drawLine(0, y + 1, 64, y + 1, false);
  driver.drawRect(0, y + 2, 64, 2, true);
  driver.fillRect(0, y + 4, 64, 6, false);
}

AveragesDisplay.prototype.processEvent = function (driver, e, stateStore) {
  if (e.name.indexOf(currentAverageSet) === 0) {

    // return
    // Average event
    if (y >= 120) y = offsetY;

    // bottom drawer
    drawDrawer(driver);

    // clear line
    driver.drawLine(0, y, 64, y, false, true);

    // 3 col samples
    drawSampleSample(driver, 0, y, e.value[currentGroup.layout[0][0]],  currentGroup.layout[0][1],currentGroup.layout[0][2], true);
    drawSampleSample(driver, 22, y, e.value[currentGroup.layout[1][0]], currentGroup.layout[1][1], currentGroup.layout[1][2], true);
    drawSampleSample(driver, 44, y, e.value[currentGroup.layout[2][0]], currentGroup.layout[2][1], currentGroup.layout[2][2], true);
    // ...


    // re-draw label
    if (y === offsetY) {
      drawLabel(driver, currentGroup.label);
    }

    y = y + 1;

  } else if (e.name === 'Input:B') {

    // Change Frequency

    driver.drawLine(0, y, 64, y, false);
    driver.drawLine(0, y + 1, 64, y + 1, true);
    y += 1;

    NextStep(driver);
    drawLabel(driver, currentGroup.label);

  } else if (e.name === 'Input:LongB') {

    // partial clear
    var filter = ScanlinesFilter(driver, 2);
    driver.fillRect(0, offsetY, 64, 120 - offsetY, false);
    filter.dispose();

    // sep line
    y += 1;
    driver.drawLine(0, y, 64, y, false);
    driver.drawLine(0, y + 1, 64, y + 1, true);
    y += 2;

    this.init(driver, stateStore);
  }
}

function drawLabel(driver, label) {
  // clear
  driver.fillRect(0, 120, 64, 8, false);

  // label
  driver.setTextSize(1);
  driver.setTextColor(1, 0);
  driver.setTextWrap(false);
  var x = Math.floor((64 - label.length * 6)) + 1;
  // centered: var x = Math.floor((64 - label.length * 6) / 2);
  driver.setCursor(x, 121);
  write(driver, label);

  // step
  var step = steps.indexOf(currentAverageStep);
  var max = steps.length-1;
  var px = Math.ceil((32 / max) * step) + 1;
  driver.fillRect(0, 123, px, 5, true);
}

function drawSampleSample(driver, x0, y, sample, max, min, drawTip) {
  sample = sample || 0;
  min = min || 0;

  sample = sample - min;
  max = max - min;

  var pxWidth = Math.round((width / max) * sample);
  if (pxWidth > width) pxWidth = width;

  // current bar value (width) -- dotted
  var filter = DottedFilter(driver);
  driver.drawLine(x0, y, x0 + pxWidth, y, true);
  // bar.max -- dotted
  driver.drawPixel(x0 + width + 1, y, true);
  filter.dispose();

  // bar.tip -- solid
  driver.drawPixel(x0 + pxWidth, y, true);

  // drawer.tip -- solid black
  if (drawTip) {
    driver.drawPixel(x0 + pxWidth, y + 2, false);
    driver.drawPixel(x0 + pxWidth - 1, y + 3, false);
    driver.drawPixel(x0 + pxWidth, y + 3, false);
    driver.drawPixel(x0 + pxWidth + 1, y + 3, false);
  }
}

// draw
function write(driver, string) {
  var chars = string.split('');
  chars.forEach((c) => {
    driver.write(c.charCodeAt(0));
  });
}

// export
module.exports = AveragesDisplay;
