module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var DottedFilter = require('./dotted-filter');
var NoisyFilter = require('./noisy-filter');
var ScanlineFilter = require('./scanlines-filter');
var utils = require('../utils');

var refreshDisplayDelay = 1333;
var width = 64;
var height = 128;

function OverviewDisplay(driver, events, stateStore) {
  BaseDisplay.call(this, driver, events, stateStore);
}

inherits(OverviewDisplay, BaseDisplay);

OverviewDisplay.prototype.init = function (driver, stateStore) {
  this.refreshDisplayDelay = refreshDisplayDelay;
  this.lastTimeString = '';

  drawAll(driver, stateStore.getState());
}

OverviewDisplay.prototype.processEvent = function (driver, e, stateStore) {

  switch (e.name) {
    case 'Distance':
      drawDistance(driver, e.value, 0);
      break;

    case 'Gps':
      drawMapPoint(driver, e.value, stateStore);
      // drawSpeed(driver, e.value ? e.value.speed : NaN);
      // drawAltitude(driver, e.value ? e.value.altitude : NaN);
      break;

    case 'Odometer':

      drawSpeed(driver, e.value.speed);
      drawDistance(driver, e.value.distance, 1);
      break;

    case 'Ticks':
      drawTime(driver, getTimeString(e.value));
      break;

    case 'Barometer':
      drawTemp(driver, e.value.temperature, stateStore.getState().CpuTemperature);
      break;

    // case 'Input:A':
    //   zoom(driver, stateStore, -1);
    //   break;

    // case 'Input:B':
    //   zoom(driver, stateStore);
    //   break;

    // case 'Input:C':
    //   zoom(driver, stateStore);
    //   break;

  }
};

module.exports = OverviewDisplay;

function drawAll(driver, state) {
  state = state || {};

  currentSpeedLabel = -1;
  drawSpeed(driver, state.Gps ? state.Gps.speed : NaN);
  drawTime(driver, getTimeString(state.Ticks));
  drawMap(driver, state.Path || { points: [] });
  drawDistance(driver, state.Distance, 0);
  // drawDistance(driver, state.Odometer ? state.Odometer.distance : 0, 1);

  var barometer = state.Barometer || {};
  drawTemp(driver, barometer.temperature, state.CpuTemperature);
  // drawSecondTemp(driver, state.CpuTemperature);
  // drawAltitude(driver, state.Gps ? state.Gps.altitude : NaN);
}

var mapSize = [64, 68];
var mapOffsets = [1, 32]
var mapOffsetY = mapOffsets[1];
var bounds = {
  width: mapSize[0] - 4,
  height: mapSize[1] - 4,
  zoom: 1
};

var drawMapDebounced = _.debounce(drawMap, 1333);

function drawMap(driver, path) {

  drawMapCanvas(driver);

  // empty ?
  if (!path || !path.points || path.points.length === 0) {
    var lineSize = 14;
    var x1 = Math.round(mapOffsets[0] + mapSize[0] / 2 - lineSize / 2 - 2);
    var y1 = Math.round(mapOffsets[1] + mapSize[1] / 2 - lineSize / 2 - 2);
    driver.drawLine(x1, y1, x1 + lineSize, y1 + lineSize, 1);
    driver.drawLine(x1, 1 + y1, x1 + lineSize, 1 + y1 + lineSize, 1);
    driver.drawCircle(x1 + lineSize / 2, y1 + lineSize / 2, lineSize / 2, 1);
    driver.drawCircle(x1 + lineSize / 2, 1 + y1 + lineSize / 2, lineSize / 2, 1);

    return;
  }

  var pathPoints = path.points;
  var initialCoord = pathPoints[0]; // _.last(pathPoints)
  initBounds(bounds, initialCoord);

  setTimeout(() =>
    renderWholePath(driver, pathPoints, mapOffsets),
    33);
}

function drawMapCanvas(driver) {
  driver.fillRect(0, mapOffsetY - 1, mapSize[0], mapSize[1] + 2, 0);
  var filter = NoisyFilter(driver);
  driver.drawRect(0, mapOffsetY - 1, mapSize[0], mapSize[1] + 2, 1);
  filter.dispose();
}

var outCounter = 0;
function drawMapPoint(driver, value, stateStore, lazyFocus) {

  var coord = [value.latitude, value.longitude];
  if (!bounds.lonLeft) {
    initBounds(bounds, coord);
  }

  var pixel = getPixelCoordinate(coord, bounds);
  if (
    pixel.x > mapSize[0] || pixel.y > mapSize[1] ||
    pixel.x < 0 || pixel.y < 0) {
    // relocate
    // console.log('..out!')

    if(!lazyFocus) {
      outCounter++;
      if (outCounter > 5) {
        outCounter = 0;
        var state = stateStore.getState();
        drawMapDebounced(driver, state.Path);
      }
    }

    return;
  }

  var filter = DottedFilter(driver);
  driver.drawPixel(pixel.x + mapOffsets[0], pixel.y + mapOffsets[1], 1);
  filter.dispose();
}

var currentSpeedLabel = '';
function drawSpeed(driver, speed) {
  speed = utils.mpsToKph(speed);
  var isValid = speed >= 14;
  var newLabel = isValid ? toFixed(speed, 1) : dot + '-.-';

  //.
  if (newLabel === currentSpeedLabel) return;
  currentSpeedLabel = newLabel;

  var s = currentSpeedLabel.split('.');
  driver.setTextSize(2);

  // render from right to left
  driver.setCursor(41, 6);
  if(s[1] !== '-') driver.setTextSize(2);
  // var f = s[1] === '-' ? null : DottedFilter(driver);
  write(driver, '.' + s[1]);
  // if(f) f.dispose();


  driver.setTextSize(3);
  driver.setCursor(12, 6);
  write(driver, s[0]);
}

var currentTemp = '';
function drawTemp(driver, temp, cpuTemp) {

  if (temp || cpuTemp) {
    var newCurrentTemp = getValue(cpuTemp);

    // .
    if(newCurrentTemp === currentTemp) return;
    currentTemp = newCurrentTemp;

    driver.setTextSize(1);

    // driver.setCursor(0, 31);
    var x = width - (newCurrentTemp.length * 6) + 2;
    driver.setCursor(x, 22);


    write(driver, newCurrentTemp);
  }

  // if (pressure) {
  //   driver.setCursor(0, 33);
  //   var pressureLabel = (Math.round(pressure * 10) / 10) + ' Pa';
  //   write(driver, pressureLabel);
  // }
}

var lastSecondTemp = '';
function drawSecondTemp(driver, temp) {
    var newCurrentTemp = getValue(temp);

    // .
    if(newCurrentTemp === lastSecondTemp) return;
    lastSecondTemp = newCurrentTemp;

    var x = width - (newCurrentTemp.length * 6);

    driver.setCursor(x, 31);
    driver.setTextSize(1);
    write(driver, newCurrentTemp);
}

var lastTimeText = "";
function drawTime(driver, sTime) {
  // .
  if(lastTimeText === sTime) return;
  lastTimeText = sTime;

  driver.setTextColor(1, 0);
  driver.setTextSize(2);
  driver.setCursor(6, height - 24);
  write(driver, sTime);
}

var lastDistance = "";
function drawDistance(driver, distance, pos) {
  var text = toFixed(distance || 0, 2);
  if(lastDistance === text) return;
  lastDistance = text;

  driver.setTextColor(1, 0);
  driver.setTextSize(1);
  driver.setCursor(
    width - 6 * text.length,
    height - 7 - pos * 8);

  write(driver, text);
}

var dot = '^';
function write(driver, string) {
  var chars = string.split('');
  chars.forEach((c) => {
    var f = c === dot ? DottedFilter(driver) : null;
    if(f) {
      driver.setTextSize(2)
    }
    driver.write(c.charCodeAt(0));
    if(f) {
      driver.setTextSize(3)
      f.dispose();
    }
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

// maps stuff
function renderWholePath(driver, path, offsets) {
  if (!path || path.length == 0) return;

  offsets = offsets || [0, 0];

  var lowLongitude = _.minBy(path, (s) => s[1])[1];
  var maxLongitude = _.maxBy(path, (s) => s[1])[1];
  var latitude = _.minBy(path, (s) => s[0])[0];

  // zoom on last point only
  if (bounds.zoom > 1) {
    var last = _.last(path);
    lowLongitude = last[1] - 0.01 / bounds.zoom;
    maxLongitude = last[1] + 0.01 / bounds.zoom;
    latitude = last[0] - 0.02 / bounds.zoom;
  }

  var lonDelta = maxLongitude - lowLongitude;

  bounds.lonLeft = lowLongitude;
  bounds.lonDelta = lonDelta;
  bounds.latBottomDegree = latitude * Math.PI / 180;

  // TODO: prioritize and delay rendering of each point
  // TODO: save in 'buffer' each pixel and dont 'redraw' existing pixels
  var filter = DottedFilter(driver);
  path.forEach((coord) => {
    var pixel = getPixelCoordinate(coord, bounds);

    var isOut = pixel.x > mapSize[0] || pixel.y > mapSize[1] ||
      pixel.x < 0 || pixel.y < 0;

    if (isOut) {
      return;
    }

    driver.drawPixel(pixel.x + offsets[0], pixel.y + offsets[1], 1);
  });
  filter.dispose();
}

// graph functions
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
  bounds.zoom = 1;
  bounds.lonLeft = initialCoord[1] - 0.01;
  bounds.lonDelta = 0.02;
  bounds.latBottomDegree = (initialCoord[0] - 0.02) * Math.PI / 180;
}

function convertGeoToPixel(latitude, longitude,
  mapWidth, // in pixels
  mapHeight, // in pixels
  mapLonLeft, // in degrees
  mapLonDelta, // in degrees (mapLonRight - mapLonLeft);
  mapLatBottomDegree) // in Radians
{
  var x = (longitude - mapLonLeft) * (mapWidth / mapLonDelta);

  latitude = latitude * Math.PI / 180;
  var worldMapWidth = ((mapWidth / mapLonDelta) * 360) / (2 * Math.PI);
  var mapOffsetY = (worldMapWidth / 2 * Math.log((1 + Math.sin(mapLatBottomDegree)) / (1 - Math.sin(mapLatBottomDegree))));
  var y = mapHeight - ((worldMapWidth / 2 * Math.log((1 + Math.sin(latitude)) / (1 - Math.sin(latitude)))) - mapOffsetY);

  return { x: x, y: y };
}

function zoom(driver, stateStore, modif) {
  modif = modif === -1 ? -1 : 1;
  // abort/return false if path is unexistint
  console.log('zoom', bounds);
  var state = stateStore.getState();
  if (state && state.Path && state.Path.points) {
    bounds.zoom += 1// * modif;

    if (bounds.zoom > 6) bounds.zoom = 1;
    // if (bounds.zoom == 0) bounds.zoom = 5;

    drawMapCanvas(driver);
    renderWholePath(driver, state.Path.points, mapOffsets);
  }
}

const getValue = (t) => t ? Math.round(t) + 'c' : '..';
