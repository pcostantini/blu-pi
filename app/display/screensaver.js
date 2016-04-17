var BaseDisplay = require('./base-display');
var inherits    = require('util').inherits;

var width = 64;
var height = 128;

var kmPh = NaN;

inherits(ScreenSaverDisplay, BaseDisplay);

function ScreenSaverDisplay(driver, eventsStream, state) {
  BaseDisplay.call(this, driver, eventsStream);
}

ScreenSaverDisplay.prototype.init = function(driver, state) {
  driver.fillRect(0, 4, 64, 124, false);
  drawBackground(driver);
};

ScreenSaverDisplay.prototype.heartbeat = function(driver) {
  driver.fillRect(0, 4, 64, 124, false);
  drawSpeed(driver, kmPh);
  drawBackground(driver);
}

ScreenSaverDisplay.prototype.processEvent = function(driver, state, e) {
  switch(e.name) {

    case 'CpuLoad':
      drawCpu(driver, e.value);
      break;

    case 'Gps':

      var speed = e.value ? e.value.speed : 0;
      if(speed == undefined) speed = 0;
      kmPh = mpsTokph(speed);

      drawSpeed(driver, kmPh);
      break;

    case 'MagnometerHeading':
    case 'Acceleration':
    case 'MagnometerAxis':
      // console.log(e)
  }
}

module.exports = ScreenSaverDisplay;


// graph functions
function drawCpu(driver, cpuState) {
  driver.fillRect(0, 0, height, 4, true);
  var cpu = cpuState[0] < 2 ? cpuState[0] : 2;
  var cpuWidth = Math.round((width / 2) * (2-cpu));
  driver.fillRect(cpuWidth, 1, width - cpuWidth - 1, 2, false);
}

function drawBackground(driver) {
  driver.drawCircle(width/2, 92, getRandomArbitrary(), true);
  driver.drawLine(getRandomArbitrary(), 2, getRandomArbitrary(), 127, true);
  driver.drawLine(getRandomArbitrary(), 4, getRandomArbitrary(), 127, true);
}

const mpsTokph = (mps) => Math.round(mps * 3.6 * 100) / 100;
function drawSpeed(driver, kmPh) {
  driver.setCursor(10, height - 45);
  driver.setTextSize(2);
  driver.setTextColor(1, 0);
  var sKph = !isNaN(kmPh) ? toFixed(kmPh, 1) : '-.-';
  var chars = sKph.split('');
  chars.forEach((c) => {
    driver.write(c.charCodeAt(0));
  });

}

function getRandomArbitrary() {
  return Math.random() * (55 - 9) + 9;
}

function toFixed(value, precision) {
    var precision = precision || 0,
        power = Math.pow(10, precision),
        absValue = Math.abs(Math.round(value * power)),
        result = (value < 0 ? '-' : '') + String(Math.floor(absValue / power));

    if (precision > 0) {
        var fraction = String(absValue % power),
            padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');
        result += '.' + padding + fraction;
    }
    return result;
}