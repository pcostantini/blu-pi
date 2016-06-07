module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var noisyFilter = require('./noisy-filter');

var width = 64;
var height = 128;
var speedAccumulator = [];

function ScreenSaverDisplay(driver, events, stateStore) {
  noisyFilter(driver);
  BaseDisplay.call(this, driver, events, stateStore);
}
inherits(ScreenSaverDisplay, BaseDisplay);

ScreenSaverDisplay.prototype.init = function (driver, stateStore) {
  this.refreshDisplayDelay = 333;
  drawAll(driver, stateStore.getState());
}
ScreenSaverDisplay.prototype.preFlush = function (driver, stateStore) {
  drawAll(driver, stateStore.getState());
}
ScreenSaverDisplay.prototype.processEvent = function (driver, e, stateStore) {
  switch (e.name) {

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
    case 'Ticks':
      var state = stateStore.getState();

      var speed = state.Gps ? state.Gps.speed : 0;
      if (!_.isNumber(speed)) {
        speed = 0;
      }

      speedAccumulator.push(speed);
      if(speedAccumulator.length > keepN) {
        speedAccumulator = speedAccumulator.slice(speedAccumulator.length - keepN);
      }

      break;
  }
}

module.exports = ScreenSaverDisplay;

function drawAll(driver, state) {
  if (!state) return;
  var speed = state.Gps ? state.Gps.speed : NaN;
  var wifi = state.Wifi ? state.Wifi.length : 0;

  driver.fillRect(0, 4, 64, 124, false);
  drawSpeed(driver, speed, true);
  drawBackground(driver, state);
  drawWifi(driver, wifi, true);
};

var offsetX = 9;
var offsetY = 15;

var takeN = 3;
var previousN = 10;
var keepN = takeN + previousN;
function drawBackground(driver, state) {
  var speed = (state.Gps ? state.Gps.speed : 0) || 0;
  var radious = (speed + 1) * Math.PI;
  driver.drawCircle(width / 2 + offsetX, 92 + offsetY, radious, true);

  var a = speedAccumulator;
  var lastN = a.slice(a.length - takeN);
  var previous = a.slice(0, a.length - takeN);

  var previousSpeedAvg = mpsTokph(average(previous));
  var currentSpeedAvg = mpsTokph(average(lastN));

  // console.log({
  //   prev: previous.join(','),
  //   last: lastN.join(',') ,
  //   prevAvg: previousSpeedAvg,
  //   lastAvg: currentSpeedAvg
  // });

  var modifier = 1.95;
  driver.drawLine(previousSpeedAvg * modifier, 4, currentSpeedAvg * modifier, 127, true);
}

var currentSpeed = NaN;
function drawSpeed(driver, speed, force) {
  if (!force && speed === currentSpeed) return;
  currentSpeed = speed;

  var kmPh = !isNaN(speed) ? mpsTokph(speed) : NaN;
  driver.setCursor(11, height - 50 + offsetY);
  driver.setTextSize(2);
  driver.setTextColor(1, 0);
  var sKmPh = !isNaN(kmPh) ? toFixed(kmPh, 1) : '-.-';
  write(driver, sKmPh)
}

var currentWifi = 0;
function drawWifi(driver, count, force) {
  if (!force && currentWifi === count) return;
  currentWifi = count;

  if (currentWifi > 0) {
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
  if (r > 45) {
    r = r0;
  }

  console.log('r', r)
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

// https://gist.github.com/JamieMason/1111276
function average(arr) {
  return _.reduce(arr, function (memo, num) {
    return memo + num;
  }, 0) / (arr.length === 0 ? 1 : arr.length);
}

function mpsTokph(mps) {
  return Math.round(mps * 3.6 * 100) / 100
}
