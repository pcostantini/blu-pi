var GpsDistance = require('gps-distance');

var refreshDisplayDelay = 1000;
var width = 64;
var height = 128;

function DistanceDisplay(driver, eventsStream, state) {

  driver.clear();

  var displayState = {
    bit: false,
    distance: 0,
    lastCoord: null,
    speed: 0,
    altitude: 0
  };

  this.eventsSubscription = eventsStream.subscribe((s) => {
    try {
      switch(s.name) {
        case 'CpuLoad':
          drawCpu(driver, s.value);
          break;

        case 'Ticks':
          displayState.bit = !displayState.bit;
          drawBit(driver, displayState.bit);

          // TODO: time
          break;

        case 'Gps':

          // distance
          var coord = [s.value.latitude, s.value.longitude];
          if(displayState.lastCoord) {
            var offset = GpsDistance(
              displayState.lastCoord[0], displayState.lastCoord[1],
              coord[0], coord[1]);
            displayState.distance += offset;
          }
          displayState.lastCoord = coord;

          // speed
          var speed = s.value ? s.value.speed : 0;
          if(speed == undefined) speed = 0;
          displayState.speed = mpsTokph(speed);
	
          // altitude
          var altitude = s.value ? s.value.altitude : 0;
          if(altitude == undefined) altitude = 0
          displayState.altitude = altitude;

          display(driver, displayState);

          break;
      }
    } catch(err) {
      console.log('driver.draw.err!', { err: err, stack: err.stack });
    }
  });


  // initial state
  if(state && state.gpsPath) {
    // distance
    displayState.distance = GpsDistance(state.gpsPath);
    display(driver, displayState);
  }

  // refresh screen
  (function redraw(self) {
    driver.display();
    self.timeout = setTimeout(redraw.bind(null, self), refreshDisplayDelay);
  })(this);

  // graph functions
  function display(driver, values) {
    driver.fillRect(0, 6, width, height - 10, 0);

    // speed
    driver.setTextColor(1, 0);
    driver.setCursor(4, 6);
    driver.setTextSize(2);
    var sKph = toFixed(values.speed, 1); 
    write(driver, sKph);

    // altitude
    driver.setTextColor(1, 0);
    driver.setCursor(4, 22);
    driver.setTextSize(1);
    write(driver, 'A:' + Math.round(values.altitude).toString() + ' m');

    // distance
    driver.setTextColor(1, 0);
    driver.setCursor(4, height - 12);
    driver.setTextSize(1);
    write(driver, toFixed(values.distance, 1) + ' km');
  }

  function drawBit(driver, bit) {
    driver.fillRect(0, 124, 4, 4, bit ? 1 : 0);
  }

  function drawCpu(driver, cpuState) {
    driver.fillRect(0, 0, height, 4, true);
    var cpu = cpuState[0] < 2 ? cpuState[0] : 2;
    var cpuWidth = Math.round((width / 2) * (2-cpu));
    driver.fillRect(cpuWidth, 1, width - cpuWidth - 1, 2, false);
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
}

DistanceDisplay.prototype.dispose = function() {
  if(this.eventsSubscription) {
    this.eventsSubscription.dispose();
  }

  if(this.timeout) {
    clearTimeout(this.timeout);
  }
}

const mpsTokph = (mps) => Math.round(mps * 3.6 * 100) / 100;

module.exports = DistanceDisplay;