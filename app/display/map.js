module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var noisyFilter = require('./noisy-filter');
var DottedFilter = require('./dotted-filter');
var width = 64;
var height = 128;

var bounds = {
  width: width,
  height: height,
  zoom: 2
};

function MapDisplay(driver, events, stateStore) {
  // noisyFilter(driver);
  BaseDisplay.call(this, driver, events, stateStore);
  this.outCounter = 0;
}

inherits(MapDisplay, BaseDisplay);

MapDisplay.prototype.init = function (driver, stateStore) {
  this.stateStore = stateStore;
  var state = this.stateStore.getState();
  if (state && state.Path && state.Path.points) {
    var pathPoints = state.Path.points;
    var initialCoord = pathPoints[0];
    initBounds(bounds, initialCoord);
    renderWholePath(driver, pathPoints);
  }
}

MapDisplay.prototype.processEvent = function (driver, e, stateStore) {
  switch (e.name) {
    case 'Gps':
      if (!(e.value && e.value.latitude)) return;

      var coord = [e.value.latitude, e.value.longitude];
      if (!bounds.lonLeft) {
        initBounds(bounds, coord);
      }

      var pixel = getPixelCoordinate(coord, bounds);
      if (pixel.x > width || pixel.y > height ||
        pixel.x < 0 || pixel.y < 0) {
        // relocate
        console.log('..out!')
        this.outCounter++;
        if (this.outCounter > 5) {

          // draw whole map!
          this.outCounter = 0;

          console.log('..redraw')
          var state = stateStore.getState();
          driver.clear();
          renderWholePath(driver, state.Path ? state.Path.points : []);
          return;
        }
      }

      // draw point!
      drawPoint(driver, pixel, true);


      break;

    case 'Input:B':
    case 'Input:LongB':
      this.cycle(driver, this.stateStore);
      break;
  }
}

MapDisplay.prototype.cycle = function (driver, stateStore) {
  // abort/return false if path is unexistint
  var state = stateStore.getState();
  if (state && state.Path && state.Path.points) {
    bounds.zoom += 1;
    if (bounds.zoom > 4) bounds.zoom = 1;

    driver.clear();
    renderWholePath(driver, state.Path.points);

    return bounds.zoom !== 1;
  }

  return false; // no state or path ready
};


function renderWholePath(driver, path) {
  if (!path || path.length == 0) {

    var lineSize = 14;
    var x1 = Math.round(mapOffsets[0] + mapSize[0] / 2 - lineSize / 2 - 2);
    var y1 = Math.round(mapOffsets[1] + mapSize[1] / 2 - lineSize / 2 - 2);
    driver.drawLine(x1, y1, x1 + lineSize, y1 + lineSize, 1);
    driver.drawCircle(x1 + lineSize / 2, y1 + lineSize / 2, lineSize / 2, 1);


  }

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
  path.forEach((coord, ix) => {
    var pixel = getPixelCoordinate(coord, bounds);

    drawPoint(driver, pixel, (ix === path.length - 1));
  });
}

function drawPoint(driver, pixel, isCurrent) {
  if(isCurrent) {
    driver.drawCircle(pixel.x, pixel.y, 1, 1);
  } else {
    var filter = new DottedFilter(driver);
    driver.drawCircle(pixel.x, pixel.y, 1, 1)
    filter.dispose();
  }
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

  // driver.drawPixel(x, y, 1);
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

module.exports = MapDisplay;