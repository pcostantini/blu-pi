module.change_code = 1;

var BaseDisplay = require('./base-display');
var inherits    = require('util').inherits;

var noisyFilter = require('./noisy-filter');

var width = 64;
var height = 128;

function ScreenSaverDisplay(driver, events, stateStore) {
  noisyFilter(driver);
  BaseDisplay.call(this, driver, events, stateStore);
}
inherits(ScreenSaverDisplay, BaseDisplay);

ScreenSaverDisplay.prototype.init = function(driver, stateStore) {
  drawAll(driver, stateStore.getState());
}
ScreenSaverDisplay.prototype.refreshDisplayDelay = 222;
ScreenSaverDisplay.prototype.preFlush = function(driver, stateStore) {
  drawAll(driver, stateStore.getState());
}
ScreenSaverDisplay.prototype.processEvent = function(driver, e, stateStore) {
  switch(e.name) {

    // case 'Ticks':
    //   drawAll(driver, stateStore.getState());
    //   break;

    case 'Gps':
      var speed = e.value ? e.value.speed : NaN;
      drawSpeed(driver, speed);
      break;

    // TODO: drop
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

function drawAll(driver, state) {
  if(!state) return;
  var speed = state.Gps ? state.Gps.speed : NaN;
  var wifi = state.Wifi ? state.Wifi.length : 0;

  driver.fillRect(0, 4, 64, 124, false);
  drawSpeed(driver, speed, true);
  drawBackground(driver);
  drawWifi(driver, wifi, true);
};

var offsetX = 11;
var offsetY = 15;
function drawBackground(driver) {
  driver.drawCircle(width/2 + offsetX, 92 + offsetY, getRandomArbitrary(), true);

  var x1 = getRandomArbitrary();
  var x2 = getRandomArbitrary();
  x2 += (Math.random() * (1 - 9) + 9) / 2;
  x1 -= (Math.random() * (1 - 9) + 9) / 2;

  driver.drawLine(x1 + offsetX, 4, x2 + offsetX, 127, true);
  // driver.drawLine(getRandomArbitrary(), 4, getRandomArbitrary(), 127, true);
}

var currentSpeed = NaN;
const mpsTokph = (mps) => Math.round(mps * 3.6 * 100) / 100;
function drawSpeed(driver, speed, force) {
  if(!force && speed === currentSpeed) return;
  currentSpeed = speed;

  var kmPh = !isNaN(speed) ? mpsTokph(speed) : NaN;
  driver.setCursor(11, height - 45 + offsetY);
  driver.setTextSize(2);
  driver.setTextColor(1, 0);
  var sKmPh = !isNaN(kmPh) ? toFixed(kmPh, 1) : '-.-';
  write(driver, sKmPh)
}

var currentWifi = 0;
function drawWifi(driver, count, force) {
  if(!force && currentWifi === count) return;
  currentWifi = count;

  if(currentWifi > 0) {
    driver.setCursor(10, height - 10);
    driver.setTextSize(1);
    driver.setTextColor(1, 0);
    var string = 'wifi:' + count;
    write(driver, string);
  }
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
  r = r + 0.333;

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