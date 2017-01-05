module.change_code = 1;
var inherits    = require('util').inherits;
var BaseDisplay = require('./base-display');
var noisyFilter = require('./noisy-filter');

var width = 64;
var height = 128;

function DistanceDisplay(driver, events, stateStore) {
  // noisyFilter(driver);
  BaseDisplay.call(this, driver, events, stateStore);
}

inherits(DistanceDisplay, BaseDisplay);

DistanceDisplay.prototype.init = function(driver, stateStore) {
  this.refreshDisplayDelay = 333;

  drawAll(driver, stateStore.getState());
}

DistanceDisplay.prototype.processEvent = function(driver, e, stateStore) {
  switch(e.name) {
    case 'Distance':
      drawDistance(driver, e.value);
      break;

    case 'Gps':
      drawSpeed(driver, e.value ? e.value.speed : NaN);
      drawAltitude(driver, e.value ? e.value.altitude : NaN);
      break;

    case 'Ticks':
      var ticks = e.value[0];
      drawTime(driver, ticks);
      break;
    
    case 'Barometer':
      drawTemp(driver, e.value.temperature, e.value.pressure);
      break;
    
  }
};

module.exports = DistanceDisplay;

function drawAll(driver, state) {
  if(!state) return;
  drawMap(driver, state.Path);
  drawSpeed(driver, state.Gps ? state.Gps.speed : NaN);
  drawAltitude(driver, state.Gps ? state.Gps.altitude : NaN);
  drawDistance(driver, state.Distance);
  drawTime(driver, state.Ticks[0]);
  drawTemp(driver, state.Barometer.temperature, state.Barometer.pressure);
}

function drawMap(driver, path) {
  driver.drawRect(0, 44, 64, 64, true);

  // ...
  // console.log(path.points);
}

function drawSpeed(driver, speed) {
  driver.setCursor(0, 8);
  driver.setTextSize(2);

  if(isNaN(speed)) {
    write(driver, '-.-');
  } else {
    var s = toFixed(mpsToKph(speed), 1);
    write(driver, s);
  }
}

function drawTemp(driver, temp, pressure) {
  driver.fillRect(0, 25, 64, 18, false)
  driver.setCursor(0, 25);
  driver.setTextSize(1);
  write(driver, temp + ' C');

  // driver.setCursor(0, 24);
  // write(driver, '.');
  
  driver.setCursor(0, 35);
  write(driver, Math.round(pressure * 10) / 10 + ' Pa');
}

function drawAltitude(driver, altitude) {
  // var altText = !isNaN(altitude) ? (toFixed(altitude, 1)  + ' m') : '-';
  // driver.setCursor(4, 24);
  // driver.setTextSize(1);
  // write(driver, 'A:' + altText);
}

function drawTime(driver, ticks) {
  ticks = ticks || 0;
  var elapsed = Math.round(ticks / 1000);
  var sTime = formatTime(elapsed);

  driver.setTextColor(1, 0);
  driver.setCursor(0, height - 18);
  driver.setTextSize(1);
  write(driver, sTime);
}

function drawDistance(driver, distance) {
  distance = distance || 0;
  driver.setTextColor(1, 0);
  driver.setCursor(0, height - 8);
  driver.setTextSize(1);
  write(driver, toFixed(distance, 1) + ' km');
}

function write(driver, string) {
  var chars = string.split('');
  chars.forEach((c) => {
    driver.write(c.charCodeAt(0));
  });
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

const mpsToKph = (mps) => Math.round(mps * 3.6 * 100) / 100;

function formatTime(ticks) {
  if(isNaN(ticks)) return '--:--';
  var hh = Math.floor(ticks / 3600);
  var mm = Math.floor((ticks % 3600) / 60);

  return pad(hh, 2) + ':' + pad(mm, 2);
}

function pad(n, width) {
  var n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}
