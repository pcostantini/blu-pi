module.change_code = 1;

var BaseDisplay = require('./base-display');
var inherits    = require('util').inherits;

var width = 64;
var height = 128;
var kmPh = NaN;
var wifi = 0;

function ScreenSaverDisplay(driver, events) {
  BaseDisplay.call(this, driver, events);
}

inherits(ScreenSaverDisplay, BaseDisplay);

ScreenSaverDisplay.prototype.heartbeat = function(driver) {
  driver.fillRect(0, 4, 64, 124, false);
  drawSpeed(driver, kmPh);
  drawBackground(driver);
  drawWifi(driver, wifi);
}

ScreenSaverDisplay.prototype.processEvent = function(driver, e) {
  switch(e.name) {

    case 'State':

    // TODO: reduce speed

      // e.value.speed = double (KmsPerHour). eg: 0.1
      var speed = e.value.Gps ? e.value.Gps.speed : NaN;
      var kmPhState = !isNaN(speed) ? mpsTokph(speed) : NaN;

      if(kmPh !== kmPhState) {
        kmPh = kmPhState;
        drawSpeed(driver, kmPh);
      }
      break;

    case 'Wifi':
      wifi = e.value.length;
      drawWifi(driver, wifi);

      break;

    case 'MagnometerHeading':
    case 'Acceleration':
    case 'MagnometerAxis':
      // console.log(e)
      break;
  }
}

module.exports = ScreenSaverDisplay;


// graph functions

function drawBackground(driver) {
  driver.drawCircle(width/2, 92, getRandomArbitrary(), true);

  var x1 = getRandomArbitrary();
  var x2 = getRandomArbitrary();
  x2 += (Math.random() * (1 - 9) + 9) / 2;
  x1 -= (Math.random() * (1 - 9) + 9) / 2;

  driver.drawLine(x1, 2, x2, 127, true);
  // driver.drawLine(getRandomArbitrary(), 4, getRandomArbitrary(), 127, true);
}

const mpsTokph = (mps) => Math.round(mps * 3.6 * 100) / 100;
function drawSpeed(driver, kmPh) {
  driver.setCursor(10, height - 45);
  driver.setTextSize(2);
  driver.setTextColor(1, 0);
  var sKph = !isNaN(kmPh) ? toFixed(kmPh, 1) : '-.-';
  write(driver, sKph)
}

function drawWifi(driver, count) {
  driver.setCursor(10, height - 10);
  driver.setTextSize(1);
  driver.setTextColor(1, 0);
  var string = 'wifi:' + count;
  write(driver, string);
}

function write(driver, string) {
  var chars = string.split('');
  chars.forEach((c) => {
    driver.write(c.charCodeAt(0));
  });
}

var r0 = Math.PI * Math.PI;
var r = r0;
function getRandomArbitrary() {
  r = r + 0.15;

  // + factor
  // like vibration
  // speed
  // ... more of it will make noise

  if(r > 45) {
    r = r0;
  }
  return r;
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