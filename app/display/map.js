var _ = require('lodash');

var refreshDisplayDelay = 1000;
var width = 63;
var height = 128;

var bounds = {
  width: width,
  height: height,
  zoom: 1
};

module.exports = function Display(driver, eventsStream, state) {

  driver.clear();

  var bit = false;
  eventsStream.subscribe((s) => {
    try {
      switch(s.name) {
        case 'Ticks':
          bit = !bit;
          drawBit(driver, bit);
          break;

        case 'Gps':
          if(s.value && s.value.latitude) {
            var coord = [s.value.latitude, s.value.longitude];
            if(!bounds.lonLeft) {
              initBounds(bounds, coord);
            }

            drawPathCoordinate(driver, coord, bounds);
          }

          break;

        case 'Input:Ok':
          bounds.zoom += 1;
          if(bounds.zoom > 4) bounds.zoom = 1;

          if(state && state.gpsPath) {
            console.log('zooooomin!', bounds.zoom)
            driver.clear();
            renderWholePath(driver, state.gpsPath);
          }

          break;
      }
    } catch(err) {
      console.log('driver.draw.err!', { err: err, stack: err.stack });
    }
  });

  // render current path
  if(state && state.gpsPath) {
    renderWholePath(driver, state.gpsPath);
  }

  // refresh screen
  (function redraw() {
    driver.display();
    setTimeout(redraw, refreshDisplayDelay);
  })();
}

function renderWholePath(driver, path) {
  if(!path || path.length == 0) return;

  var lowLongitude = _.minBy(path, (s) => s[1])[1];
  var maxLongitude = _.maxBy(path, (s) => s[1])[1];
  var latitude = _.minBy(path, (s) => s[0])[0];

  // zoom on last point only
  if(bounds.zoom > 1) {
    var last = _.last(path);
    lowLongitude = last[1] - 0.01 / bounds.zoom;
    maxLongitude = last[1] + 0.01 / bounds.zoom;
    latitude = last[0] - 0.02 / bounds.zoom;
  }

  var lonDelta = maxLongitude - lowLongitude;
  
  bounds.lonLeft         = lowLongitude;
  bounds.lonDelta        = lonDelta;
  bounds.latBottomDegree = latitude * Math.PI / 180;

  path.forEach(coord => drawPathCoordinate(driver, coord, bounds));
}

// graph functions
function drawPathCoordinate(driver, coord, bounds) {

  var point = convertGeoToPixel(
    coord[0], coord[1],
    bounds.width,
    bounds.height,
    bounds.lonLeft,
    bounds.lonDelta,
    bounds.latBottomDegree);

  var x = Math.round(point.x);
  var y = Math.round(point.y);
  
  driver.drawPixel(x, y, 1);
}

function initBounds(bounds, initialCoord) {
  bounds.zoom            = 1;
  bounds.lonLeft         = initialCoord[1] - 0.01;
  bounds.lonDelta        = 0.02;
  bounds.latBottomDegree = (initialCoord[0] - 0.02) * Math.PI / 180;
  console.log('bounds inited', bounds);
}

function drawBit(driver, bit) {
  driver.fillRect(0, 0, 4, 4, bit ? 1 : 0);
}

function convert(lat, lon){
  var y = ((-1 * lat) + 90) * (height / 180);
  var x = (lon + 180) * (width / 360);
  return {x:x,y:y};
}

function convertGeoToPixel(latitude, longitude ,
                           mapWidth , // in pixels
                           mapHeight , // in pixels
                           mapLonLeft , // in degrees
                           mapLonDelta , // in degrees (mapLonRight - mapLonLeft);
                           mapLatBottomDegree) // in Radians
{
    var x = (longitude - mapLonLeft) * (mapWidth / mapLonDelta);

    latitude = latitude * Math.PI / 180;
    var worldMapWidth = ((mapWidth / mapLonDelta) * 360) / (2 * Math.PI);
    var mapOffsetY = (worldMapWidth / 2 * Math.log((1 + Math.sin(mapLatBottomDegree)) / (1 - Math.sin(mapLatBottomDegree))));
    var y = mapHeight - ((worldMapWidth / 2 * Math.log((1 + Math.sin(latitude)) / (1 - Math.sin(latitude)))) - mapOffsetY);

    return { x: x, y: y };
}