module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var DottedFilter = require('./dotted-filter');
var NoisyFilter = require('./noisy-filter');
var ScanlineFilter = require('./scanlines-filter');
var utils = require('../utils');

var refreshDisplayDelay = 500;
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
      drawMapPoint(driver, e.value, stateStore.getState().Path);
      drawSpeed(driver, e.value ? e.value.speed : 0);
      drawAltitude(driver, e.value ? e.value.altitude : NaN);
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

    case 'CpuTemperature':
      var barometer = stateStore.getState().Barometer || {};
      drawTemp(driver, barometer.temperature, e.value);
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
  drawMap(driver, state.Path || { points: [] });
  drawSpeed(driver, state.Gps ? state.Gps.speed : 0);
  drawDistance(driver, state.Distance, 0);
  drawTime(driver, getTimeString(state.Ticks));

  var barometer = state.Barometer || {};
  drawTemp(driver, barometer.temperature, state.CpuTemperature);
  drawAltitude(driver, state.Gps ? state.Gps.altitude : NaN);
}

var mapSize = [64, 70];
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
    console.log('Empty!')
    var lineSize = 14;
    var x1 = Math.round(mapOffsets[0] + mapSize[0] / 2 - lineSize / 2 - 2);
    var y1 = Math.round(mapOffsets[1] + mapSize[1] / 2 - lineSize / 2 - 2);

    driver.drawCircle(x1 + lineSize / 2, y1 + lineSize / 2, lineSize / 2, 1);
    driver.drawLine(x1, y1, x1 + lineSize, y1 + lineSize, 1);

    x1 += 1;
    y1 += 1;

    var filter = ScanlineFilter(driver, 2)
    driver.drawCircle(x1 + lineSize / 2, y1 + lineSize / 2, lineSize / 2, 1);
    driver.drawLine(x1, y1, x1 + lineSize, y1 + lineSize, 1);
    filter.dispose();

    return;
  }

  var pathPoints = path.points;
  var initialCoord = pathPoints[0]; // _.last(pathPoints)
  initBounds(bounds, initialCoord);

  setTimeout(
    () => renderWholePath(driver, pathPoints, mapOffsets), 33);
}

function drawMapCanvas(driver) {
  // var f2 = NoisyFilter(driver, 1);
  driver.fillRect(0, mapOffsetY - 2, mapSize[0], mapSize[1] + 3, 0);
  var f1 = ScanlineFilter(driver, 2)
  driver.drawRect(0, mapOffsetY - 2, mapSize[0], mapSize[1] + 3, 1);
  f1.dispose();
  // f2.dispose();
}

var outCounter = 0;
function drawMapPoint(driver, value, fullPath, lazyFocus) {

  var coord = [value.latitude, value.longitude];
  if(!coord[0]) return;

  // console.log('drawMapPoint', coord)
  if (!bounds.lonLeft) {
    initBounds(bounds, coord);
  }

  var pixel = getPixelCoordinate(coord, bounds);
  if (
    pixel.x > mapSize[0] || pixel.y > mapSize[1] ||
    pixel.x < 0 || pixel.y < 0) {
    // relocate
    // console.log('..out!')

    if (!lazyFocus) {
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

var currentSpeedLabel = '';
function drawSpeed(driver, speed) {
  speed = utils.mpsToKph(speed);
  var isValid = speed >= 1;
  var newLabel = isValid ? toFixed(speed, 1) : '0.0';
  newLabel = (newLabel.length === 3)
    ? '0' + newLabel
    : newLabel;

  //.
  if (newLabel === currentSpeedLabel) return;
  currentSpeedLabel = newLabel;


  driver.setTextSize(3);
  driver.setCursor(6, 6);
  write(driver, newLabel.split('.')[0]);
  driver.setTextSize(2);
  driver.setCursor(39, 8);
  write(driver, '.' + newLabel.split('.')[1]);
}

var lastDistance = "";
function drawDistance(driver, distance, pos) {
  var text = toFixed(distance || 0, 2);
  if (lastDistance === text) return;
  lastDistance = text;

  driver.setTextColor(1, 0);
  driver.setTextSize(1);
  driver.setCursor(
    1 + width - 6 * text.length,
    height - 23);

  write(driver, text);
}

function drawAltitude() {
  // not implemented!
}

var currentTemp = '';
function drawTemp(driver, temp, cpuTemp) {
  temp = temp || cpuTemp || 0;
  var newCurrentTemp = getValue(cpuTemp);
  if (newCurrentTemp === currentTemp) return;

  currentTemp = newCurrentTemp;
  // var x = width - (newCurrentTemp.length * 6) + 2;
  driver.setCursor(1, mapOffsetY + mapSize[1] - 6);
  driver.setTextSize(1);
  write(driver, newCurrentTemp);

  // if (pressure) {
  //   driver.setCursor(0, 33);
  //   var pressureLabel = (Math.round(pressure * 10) / 10) + ' Pa';
  //   write(driver, pressureLabel);
  // }
}

var lastTimeText = "";
function drawTime(driver, sTime) {
  // .
  if (lastTimeText === sTime) return;
  lastTimeText = sTime;

  driver.setTextColor(1, 0);
  driver.setTextSize(2);
  driver.setCursor(6, height - 14);
  var filter = ScanlineFilter(driver, 1);
  write(driver, sTime);
  filter.dispose();
}

var dot = '^';
function write(driver, string) {
  var chars = string.split('');
  chars.forEach((c) => driver.write(c.charCodeAt(0)));
  // chars.forEach((c) => {
  //   var f = c === dot;// ? DottedFilter(driver) : null;
  //   if (f) {
  //     driver.setTextSize(2)
  //   }
  //   driver.write(c.charCodeAt(0));
  //   if (f) {
  //     driver.setTextSize(3)
  //     // f.dispose();
  //   }
  // });
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

  drawMapCanvas(driver);

  // TODO: prioritize and delay rendering of each point
  // TODO: save in 'buffer' each pixel and dont 'redraw' existing pixels
  var filter = NoisyFilter(driver, .5);
  path.forEach((coord) => {
    var pixel = getPixelCoordinate(coord, bounds);
    var isOut = pixel.x > mapSize[0] || pixel.y > mapSize[1] ||
      pixel.x < 0 || pixel.y < 0;

    if (isOut) return;
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
