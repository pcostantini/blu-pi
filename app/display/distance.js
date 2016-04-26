module.change_code = 1;

var BaseDisplay = require('./base-display');
var inherits    = require('util').inherits;

var width = 64;
var height = 128;

function DistanceDisplay(driver, events) {
  BaseDisplay.call(this, driver, events);

  driver.setTextColor(1, 0);

  this.state = {
    duration: '--:--',
    distance: NaN,
    altitude: NaN,
    speed: NaN
  }
}

inherits(DistanceDisplay, BaseDisplay);

DistanceDisplay.prototype.processEvent = function(driver, e) {

  var state = this.state;

  switch(e.name) {
    case 'State':

      // distance
      if(e.value.Distance !== state.distance) {
        state.distance = e.value.Distance;
        drawDistance(driver, state.distance);
      }

      break;
    case 'Gps':

      var speed = e.value ? e.value.speed : NaN;
      if(state.speed !== speed) {
        state.speed = speed;
        drawSpeed(driver, state.speed);
      }

      var altitude = e.value ? e.value.altitude : NaN;
      if(state.altitude !== altitude) {
        state.altitude = altitude;
        drawAltitude(driver, state.altitude);
      }

      break;
    case 'Ticks':

      var ticks = e.value[0];
      var elapsed = Math.round(ticks / 1000);
      var duration = formatTime(elapsed);
      if(state.duration !== duration) {
        state.duration = duration;
        drawTime(driver, duration);
      }

      break;
  }
};

module.exports = DistanceDisplay;

function drawSpeed(driver, speed) {
  driver.setCursor(4, 6);
  driver.setTextSize(2);

  if(isNaN(speed)) {
    write(driver, '-.-');
  } else {
    var s = toFixed(mpsToKph(speed), 1);
    write(driver, s);
  }
}

function drawAltitude(driver, altitude) {
  driver.setCursor(4, 24);
  driver.setTextSize(1);

  var altText = !isNaN(altitude) ? (toFixed(altitude, 1)  + ' m') : '-';
  write(driver, 'A:' + altText);
}

function drawTime(driver, sTime) {
  driver.setTextColor(1, 0);
  driver.setCursor(4, height - 22);
  driver.setTextSize(1);
  write(driver, sTime);
}

function drawDistance(driver, distance) {
  driver.setTextColor(1, 0);
  driver.setCursor(4, height - 12);
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
  var hh = Math.floor(ticks / 3600);
  var mm = Math.floor((ticks % 3600) / 60);

  return pad(hh, 2) + ':' + pad(mm, 2);
}

function pad(n, width) {
  var n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}
