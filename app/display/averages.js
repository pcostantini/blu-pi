module.change_code = 1;

// long click: change group
// next: averages - lower frequency
// prev: averages - higher frequency

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var DottedFilter = require('./dotted-filter');
var ScanlinesFilter = require('./scanlines-filter');
var NoiseFilter = require('./noisy-filter');

var offsetY = 5;
var y = offsetY;
var steps = require('../state').AverageSensorSteps;
var currentAverageStep = steps[0];
var currentAverageSet = 'Average_' + currentAverageStep;
var layouts = [
  {
    label: 'SPD',
    layout: [
      // ['SpeedGps', 40, 0],
      ['Cadence', 100, 40],
      ['SpeedOdometer', 40, 0]
    ],
    layoutWidth: 30
  }, {
    label: 'SYS.CORE',
    layout: [
      ['MagnometerTemperature', 50, 24],
      ['CpuTemperature', 77, 33],
      ['CpuLoad', 1.5, 0]
    ],
    layoutWidth: 19
  }
]
var currentLayout = _.first(layouts);
var width = currentLayout.layoutWidth;

function AveragesDisplay(driver, events, stateStore) {
  this.refreshDisplayDelay = 1000;
  BaseDisplay.call(this, driver, events, stateStore);
}

inherits(AveragesDisplay, BaseDisplay);

function PreviousStep(driver) {
  y++;
  driver.drawLine(0, y, 64, y, true);

  var ix = steps.indexOf(currentAverageStep);
  currentAverageStep = steps[ix - 1];
  if (!currentAverageStep) currentAverageStep = steps[steps.length - 1];
  currentAverageSet = 'Average_' + currentAverageStep;

  return currentAverageSet;
}


function NextStep(driver) {
  y++;
  driver.drawLine(0, y, 64, y, true);

  var ix = steps.indexOf(currentAverageStep);
  currentAverageStep = steps[ix + 1];
  if (!currentAverageStep) currentAverageStep = steps[0];
  currentAverageSet = 'Average_' + currentAverageStep;
}

AveragesDisplay.prototype.init = function (driver, stateStore) {

  var state = stateStore.getState() || { Averages: [] };
  var o = state.Averages || [];
  var a = o[currentAverageSet];
  var page = _.takeRight(a, 164 - offsetY);

  drawLabel(driver, currentLayout.label);

  _.forEach(page, function (e, ix) {

    if (y >= 120) y = offsetY;

    // re-draw label
    if (y === offsetY) {
      drawLabel(driver, currentLayout.label);
    }

    var tip = ix === page.length - 1;

    // clear line
    driver.drawLine(0, y, 64, y, false, true);

    if (tip) {
      // bottom drawer
      drawDrawer(driver);
    }

    // 3 col samples
    for (var i = 0; i < currentLayout.layout.length; i++) {
      var layout = currentLayout.layout[i];
      drawSample(driver, i * currentLayout.layoutWidth, y, e[layout[0]], layout[1], layout[2], tip);
    }

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

    // NEW AVERAGE EVENT

    if (y >= 120) y = offsetY;

    // bottom drawer
    drawDrawer(driver);

    // clear line
    driver.drawLine(0, y, 64, y, false, true);

    // col samples
    for (var i = 0; i <= currentLayout.layout.length; i++) {
      var layout = currentLayout.layout[i];
      if (layout) {
        drawSample(driver, i * currentLayout.layoutWidth, y, e.value[layout[0]], layout[1], layout[2], true);
      }
    }
    // ...


    // re-draw label
    if (y === offsetY) {
      drawLabel(driver, currentLayout.label);
    }

    y = y + 1;

    return;

  }

  switch (e.name) {
    case 'Input:A':
    case 'Input:C':
      // Change Frequency

      driver.drawLine(0, y, 64, y, false);
      driver.drawLine(0, y + 1, 64, y + 1, true);
      y += 1;

      var step = e.name === 'Input:A' ? PreviousStep(driver) : NextStep(driver);
      drawLabel(driver, currentLayout.label);
      break;

    case 'Input:LongB':
      var ix = layouts.indexOf(currentLayout);
      currentLayout = layouts[ix + 1];
      currentLayout = currentLayout ? currentLayout : layouts[0];
      width = currentLayout.layoutWidth;

      // CONTINUE TO REDRAW
    case 'Input:B':

      // Redraw set

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
      break;
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
  var max = steps.length - 1;
  var px = Math.ceil((32 / max) * step) + 1;
  driver.fillRect(0, 123, px, 5, true);
}

function drawSample(driver, x0, y, sample, max, min, drawTip) {
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
