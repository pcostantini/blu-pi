var _ = require('lodash');

var refreshDisplayDelay = 1000;
var width = 64;
var height = 128;

// TODO
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
              centerBounds(bounds, coord);
            }

            drawPathCoordinate(driver, coord, bounds);
          }

          break;

        case 'Input:Ok':
          // bounds.zoom += 1;
          // if(bounds.zoom > 4) bounds.zoom = 1;

          bounds.zoom = 1;
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
  var latitude = _.maxBy(path, (s) => s[0])[0];
  var lonDelta = maxLongitude - lowLongitude;

  bounds.width           = width * bounds.zoom;
  bounds.height          = height * bounds.zoom;
  bounds.lonLeft         = lowLongitude;
  bounds.lonDelta        = lonDelta;
  bounds.latBottomDegree = latitude * Math.PI / 180;

  var last = _.last(path);
  var lastPixel = convertGeoToPixel(
    last[0], last[1],
    bounds.width,
    bounds.height,
    bounds.lonLeft,
    bounds.lonDelta,
    bounds.latBottomDegree);

  console.log('lastPixel', lastPixel)

  if(bounds.zoom > 1) {
    bounds.offset = {
      x: lastPixel.x - (width / 2),
      y: 0 // TODO
    };
  } else {
    bounds.offset = {x:0, y:0}
  }

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

  point.x = point.x - bounds.offset.x;
  point.y = point.y - bounds.offset.y;

  driver.drawPixel(Math.round(point.x), Math.round(point.y) - height, 1);
}

function centerBounds(bounds, coord) {
  bounds.zoom            = 1;
  bounds.width           = width * bounds.zoom;
  bounds.height          = height * bounds.zoom,
  bounds.lonLeft         = coord[1] - 0.01;
  bounds.lonDelta        = 0.02;
  bounds.latBottomDegree = (coord[0] + 0.01) * Math.PI / 180;
  bounds.offset = { x:0, y:0 };
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