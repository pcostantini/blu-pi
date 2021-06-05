module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var DottedFilter = require('./dotted-filter');
var NoisyFilter = require('./noisy-filter');
var ScanlineFilter = require('./scanlines-filter');
var convertGeoToPixel = require('./map').convertGeoToPixel;
var utils = require('../utils');

var refreshDisplayDelay = 2000;
var height = 64;

var currentSpeedLabel;
var currentCadenceLabel;
var lastTimeText;
var lastDistance;
var currentTemp;

function OverviewDisplay(driver, events, stateStore) {
  BaseDisplay.call(this, driver, events, stateStore);
}

inherits(OverviewDisplay, BaseDisplay);

OverviewDisplay.prototype.init = function (driver, stateStore) {

  var state = stateStore.getState();
  currentSpeedLabel = '';
  currentCadenceLabel = '';
  lastTimeText = '';
  lastDistance = '';
  currentTemp = '';

  this.refreshDisplayDelay = refreshDisplayDelay;
  driver.setRotation(2);

  // ...
  drawMapCanvas(driver);
  drawAll(driver, state);
}

function dim(driver) {
  var f = new DottedFilter(driver, 1);
  driver.fillRect(0, 0, 128, 64, 0);
  f.dispose();
}

var odometerPresent = false;
OverviewDisplay.prototype.processEvent = function (driver, e, stateStore) {
  switch (e.name) {

    case 'Odometer':
      if (e.value && (e.value.speed || e.value.distance)) {
        odometerPresent = true;
        drawSpeed(driver, e.value.speed);
        // drawDistance(driver, e.value.distance);
        // drawCadence(driver, (stateStore.getState().Cadence || { cadence: 0}).cadence);
      }
      break;

    case 'Gps':
      drawMapPoint(driver, e.value, stateStore.getState().Path);
      drawAltitude(driver, e.value ? e.value.altitude : NaN);
      if (!odometerPresent && e.value) {
        drawSpeed(driver, utils.mpsToKph(e.value.speed));
      }

      break;

    case 'DistanceGps':
      if (!odometerPresent) {
        drawDistance(driver, e.value);
        // drawCadence(driver, (stateStore.getState().Cadence || { cadence: 0}).cadence);
      }

      break;

    case 'Distance':
      drawDistance(driver, e.value);
      // drawCadence(driver, (stateStore.getState().Cadence || { cadence: 0}).cadence);
      break;

    case 'Cadence':
      drawCadence(driver, e.value.cadence);
      break;

    case 'Ticks':
      drawTime(driver, getTimeString(e.value));
      break;

    case 'Barometer':
      // drawTemp(driver, e.value.temperature, 0, 0);
      break;

    case 'Input:B':
      var state = stateStore.getState();

      // var distance = state.Distance || state.DistanceGps || 0;
      // drawDistance(driver, distance, true);
      drawMap(driver, state.Path || { points: [] });
      // dim(driver);
      // this.dimmed = true;

      break;

  }
};

module.exports = OverviewDisplay;

function drawAll(driver, state) {
  state = state || {};

  // static - distance bar
  var f = new DottedFilter(driver, 0);
  driver.fillRect(0, 27, 65, 2, 1)
  f.dispose();

  currentSpeedLabel = -1;
  // var speed = (state.Odometer || state.Gps || { speed: 0 }).speed;
  // var speed = state.Odometer
  // ? state.Odometer.speed      // Odometer: km/h
  // : state.Gps ? utils.mpsToKph(state.Gps.speed) : 0; // Gps.Speed: miles/h
  var speed = getSpeed(state.Odometer) || utils.mpsToKph(getSpeed(state.Gps)) || 0;
  drawSpeed(driver, speed);
  drawCadence(driver, state.Cadence ? state.Cadence.cadence : 0);
  drawTime(driver, getTimeString(state.Ticks));
  lastDistance = -1;
  var distance = state.Distance || state.DistanceGps || 0;
  drawDistance(driver, distance);

  var barometer = state.Barometer || {};
  drawTemp(driver, barometer.temperature, 0);
  drawAltitude(driver, state.Gps ? state.Gps.altitude : NaN);

  drawMap(driver, state.Path)
}

var mapSize = [57, 60];
var mapOffsets = [68, 3]
var mapOffsetY = mapOffsets[1];
var mapOffsetX = mapOffsets[0];
var bounds = {
  width: mapSize[0] - 4,
  height: mapSize[1] - 4,
};

var drawMapDebounced = _.throttle(drawMap, 333);

function drawMap(driver, path) {

  driver.fillRect(mapOffsetX - 1, mapOffsetY - 2, mapSize[0] - 2, mapSize[1] + 2, 0);

  // empty ?
  if (!path || !path.points || path.points.length === 0) {
    console.log('Empty!')
    var lineSize = 14;
    var x1 = Math.round(mapOffsets[0] + mapSize[0] / 2 - lineSize / 2 - 2);
    var y1 = Math.round(mapOffsets[1] + mapSize[1] / 2 - lineSize / 2 - 2);

    var filter = ScanlineFilter(driver, 2);
    driver.drawCircle(x1 + lineSize / 2, y1 + lineSize / 2, lineSize / 2, 1);
    driver.drawLine(x1, y1, x1 + lineSize, y1 + lineSize, 1);
    filter.dispose();

    return;
  }

  var pathPoints = path.points;
  var initialCoord = _.last(pathPoints);
  initBounds(bounds, initialCoord);

  setTimeout(
    () => renderWholePath(driver, pathPoints, mapOffsets),
    33);
}

function drawMapCanvas(driver) {
  var filter = NoisyFilter(driver, 1);
  driver.drawRect(mapOffsetX - 2, mapOffsetY - 3, mapSize[0] + 1, mapSize[1] + 4, 1);
  filter.dispose();
}

var outCounter = 0;
function drawMapPoint(driver, value, fullPath, lazyFocus) {

  if (!value) {
    return;
  }

  var coord = [value.latitude, value.longitude];
  if (!coord[0]) return;

  if (!bounds.lonLeft) {
    initBounds(bounds, coord);
  }

  var pixel = getPixelCoordinate(coord, bounds);
  var out =
    (pixel.x > mapSize[0] || pixel.y > mapSize[1]) ||
    (pixel.x < 0 || pixel.y < 0);
  if (out) {
    if (!lazyFocus) {
      // relocate
      outCounter++;
      if (outCounter > 5) {
        outCounter = 0;
        console.log('out!')
        drawMapDebounced(driver, fullPath);
      }
    }

    return;
  }

  var filter = ScanlineFilter(driver, 2);
  driver.drawPixel(pixel.x + mapOffsets[0], pixel.y + mapOffsets[1], 1);
  filter.dispose();
}

function drawSpeed(driver, speed) {
  // speed = utils.mpsToKph(speed);
  var isValid = speed >= 1;
  var newLabel = isValid ? toFixed(speed, 1) : '0.0';
  newLabel = (newLabel.length === 3)
    ? ' ' + newLabel
    : newLabel;

  if (newLabel === currentSpeedLabel) return;
  currentSpeedLabel = newLabel;

  if (speed == 0) driver.fillRect(0, 30, mapOffsetX - 5, 34, 0);
  var filter = (speed == 0) ? ScanlineFilter(driver, 2) : null;
  driver.setTextColor(1, 0);
  driver.setTextSize(4);
  driver.setCursor(-2, 32);
  write(driver, newLabel.split('.')[0]);
  driver.setTextSize(2);
  driver.setCursor(42, 36);
  write(driver, '.' + newLabel.split('.')[1]);
  if (filter) filter.dispose();
}

function drawCadence(driver, cadence) {
  var newLabel = (cadence || 0).toString();
  newLabel = newLabel.slice(-3);
  if (currentCadenceLabel === newLabel) {
    return;
  }

  currentCadenceLabel = newLabel;

  var filter = (cadence == 0) ? DottedFilter(driver) : null;
  driver.fillRect(46, height - 12, 18, 11, 1)
  driver.setTextColor(0, 1);
  driver.setTextSize(1);
  driver.setCursor(48, height - 10);
  write(driver, newLabel.replace(/0/g, 'O',));

  if (filter) filter.dispose();
}

function drawTime(driver, sTime) {
  if (lastTimeText === sTime) return;
  lastTimeText = sTime;

  driver.setTextColor(1, 0);
  driver.setTextSize(2);
  driver.setCursor(6, 1);
  write(driver, sTime);
}

function drawDistance(driver, distance, redraw) {
  var text = toFixed(distance || 0, 1);
  if (!redraw && lastDistance === text) {
    return;
  }

  lastDistance = text;

  driver.fillRect(0, 18, 65, 9, 1)
  driver.setTextColor(0, 1);
  driver.setTextSize(1);
  driver.setCursor(22, 19);
  write(driver, ('  ' + text + '\km').slice(-7));
}

function drawAltitude(driver, altitude) {
  // not implemented!
}

function drawTemp(driver, temp, cpuTemp, ambientPressure) {
  temp = temp || cpuTemp || 0;
  var newCurrentTemp = getValue(cpuTemp);
  if (newCurrentTemp === currentTemp) return;

  currentTemp = newCurrentTemp;
  // var x = width - (newCurrentTemp.length * 6) + 2;
  driver.setTextColor(1)
  driver.setCursor(mapOffsetX + 1, height - 10);
  driver.setTextSize(1)
  write(driver, newCurrentTemp);

  // if (ambientPressure) {
  //   driver.setCursor(0, 33);
  //   var pressureLabel = (Math.round(ambientPressure * 10) / 10) + ' Pa';
  //   write(driver, pressureLabel);
  // }
}

function write(driver, string) {
  var chars = string.split('');
  chars.forEach((c) => driver.write(c.charCodeAt(0)));
}

// maps stuff
function renderWholePath(driver, path, offsets) {
  if (!path || path.length == 0) return;

  offsets = offsets || [0, 0];

  var lowLongitude = _.minBy(path, (s) => s[1])[1] - 0.0014;
  var maxLongitude = _.maxBy(path, (s) => s[1])[1] + 0.0014;
  var latitude = _.minBy(path, (s) => s[0])[0];

  var lonDelta = maxLongitude - lowLongitude;

  bounds.lonLeft = lowLongitude;
  bounds.lonDelta = lonDelta;
  bounds.latBottomDegree = latitude * Math.PI / 180;

  var filter = DottedFilter(driver);
  path.forEach((coord) => {
    var pixel = getPixelCoordinate(coord, bounds);
    var isOut = pixel.x > mapSize[0] || pixel.y > mapSize[1] ||
      pixel.x < 0 || pixel.y < 0;

    if (isOut) return;
    driver.drawPixel(pixel.x + offsets[0], pixel.y + offsets[1], 1);
  });

  filter.dispose();
}

function getPixelCoordinate(coord, bounds) {

  var point = convertGeoToPixel(
    coord[0], coord[1],
    bounds.width,
    bounds.height,
    bounds.lonLeft,
    bounds.lonDelta,
    bounds.latBottomDegree);

  var x = Math.round(point.x);
  var y = Math.round(point.y);

  return { x: x, y: y };
}

function initBounds(bounds, initialCoord) {
  bounds.lonLeft = initialCoord[1] - 0.01;
  bounds.lonDelta = 0.02;
  bounds.latBottomDegree = initialCoord[0] * Math.PI / 180;
}

const getValue = (t) => t ? Math.floor(t) + 'c' : '';
const getSpeed = (o) => !!o ? o.speed : 0;

// helpers


function toFixed(value, precision) {
  var precision = precision || 0,
    power = Math.pow(10, precision),
    absValue = Math.abs(Math.floor(value * power)),
    result = (value < 0 ? '-' : '') + String(Math.floor(absValue / power));

  if (precision > 0) {
    var fraction = String(absValue % power),
      padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');
    result += '.' + padding + fraction;
  }
  return result;
}

function getTimeString(ticks) {
  var totalTicks = ticks && ticks.length ? ticks[0] : 0;
  var elapsed = Math.round(totalTicks / 1000);
  return formatTime(elapsed);
}

function formatTime(ticks) {
  if (isNaN(ticks)) return '--:--';
  var hh = Math.floor(ticks / 3600);
  var mm = Math.floor((ticks % 3600) / 60);

  return pad(hh, 2) + ':' + pad(mm, 2);
}

function pad(n, width) {
  var n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}
