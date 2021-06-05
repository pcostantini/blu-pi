module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var DottedFilter = require('./dotted-filter');
var ScanlineFilter = require('./scanlines-filter');

var width = 128;
var height = 64;
var bounds = {
  width: width,
  height: height,
  zoom: 0
};
var outCounter = 0;

function MapDisplay(driver, events, stateStore) {
  BaseDisplay.call(this, driver, events, stateStore);
  driver.setRotation(2);
  outCounter = 0;
}

inherits(MapDisplay, BaseDisplay);

MapDisplay.prototype.init = function (driver, stateStore) {
  this.stateStore = stateStore;
  var state = this.stateStore.getState();
  if (state && state.Path && state.Path.points) {
    var pathPoints = state.Path.points;
    drawMapDebounced(driver, pathPoints);
  }
}

MapDisplay.prototype.processEvent = function (driver, e, stateStore) {
  var points = (stateStore.getState().Path || { points: [] }).points
  switch (e.name) {
    case 'Gps':
      if (!e.value || !e.value.latitude) return;
      drawMapPoint(driver, e.value, points);
      break;

    case 'Input:A':
      bounds.zoom -= 1;
      refreshZoom(driver, points);
      break;

    case 'Input:B':
      bounds.zoom = 0;
      refreshZoom(driver, points);
      break;

    case 'Input:C':
      bounds.zoom += 1;
      refreshZoom(driver, points);
      break;

  }
}

function refreshZoom(driver, path) {
  // driver.clear();
  driver.setTextColor(1, 0);
  driver.setTextSize(1);
  driver.setCursor(0, 0);
  var z = bounds.zoom >= 0
    ? '+' + bounds.zoom.toString()
    : bounds.zoom.toString();
  write(driver, z);
  driver.display();

  renderWholePathDebounced(driver, path);
}

var drawMapDebounced = _.throttle(drawMap, 1333);
function drawMap(driver, path) {
  console.log('drawMap()');
  driver.clear();

  // empty ?
  if (!path || !path.length) {
    console.log('Empty!')
    var lineSize = 14;
    var x1 = Math.round(width - lineSize / 2 - 2);
    var y1 = Math.round(height / 2 - lineSize / 2 - 2);

    var filter = ScanlineFilter(driver, 2);
    driver.drawCircle(x1 + lineSize / 2, y1 + lineSize / 2, lineSize / 2, 1);
    driver.drawLine(x1, y1, x1 + lineSize, y1 + lineSize, 1);
    filter.dispose();

    return;
  }

  setTimeout(
    () => renderWholePath(driver, path),
    33);
}

var renderWholePathDebounced = _.debounce(renderWholePath, 333);
function renderWholePath(driver, path) {

  driver.clear();

  // vertical sep
  driver.drawLine(width - 5, 0, width - 5, height, 1);
  driver.drawLine(width - 4, 0, width - 4, height, 0);

  if (!path || path.length == 0) return;

  var zoomModifier = (bounds.zoom * -1) + 1;
  var lowLongitude = _.minBy(path, (s) => s[1])[1] - (0.0014 * zoomModifier);
  var maxLongitude = _.maxBy(path, (s) => s[1])[1] + (0.0014 * zoomModifier);
  var lonDelta = maxLongitude - lowLongitude;

  // first
  // var latitude = _.minBy(path, (s) => s[0])[0] + (0.0014 * zoomModifier);

  // center map
  var latitude = _.meanBy(path, (s) => s[0]) - (0.0007 * zoomModifier);    // mean

  // focus on last point
  // var latitude = _.last(path, (s) => s[0])[0] - (0.0007 * zoomModifier);


  bounds.lonLeft = lowLongitude;
  bounds.lonDelta = lonDelta;
  bounds.latBottomDegree = latitude * Math.PI / 180;

  var filter = DottedFilter(driver);
  path.forEach((coord) => {
    var pixel = getPixelCoordinate(coord, bounds);
    var isOut = pixel.x > width || pixel.y > height ||
      pixel.x < 0 || pixel.y < 0;

    if (isOut) return;
    driver.drawPixel(pixel.x, pixel.y, 1);
  });

  filter.dispose();
}

function drawMapPoint(driver, value, path) {
  if (!value) {
    return;
  }

  var coord = [value.latitude, value.longitude];
  if (!coord[0]) return;

  var pixel = getPixelCoordinate(coord, bounds);
  var out =
    (pixel.x > width || pixel.y > height) ||
    (pixel.x < 0 || pixel.y < 0);
  if (out) {
    // relocate
    outCounter++;
    if (outCounter === 5) {
      outCounter = 0;
      console.log('out!')
      drawMapDebounced(driver, path);
    }

    return;
  }

  var filter = ScanlineFilter(driver, 2);
  driver.drawPixel(pixel.x, pixel.y, 1);
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

// draw text
function write(driver, string) {
  var chars = string.split("");
  chars.forEach((c) => driver.write(c.charCodeAt(0)));
}

module.exports = MapDisplay;
module.exports.convertGeoToPixel = convertGeoToPixel;