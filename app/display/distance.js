const SpeedThreshold = require('../gps_noise_filter').DefaultSpeedThreshold;

var refreshDisplayDelay = 1000;
var width = 64;
var height = 128;

function DistanceDisplay(driver, eventsStream, state) {

  driver.clear();

  var displayState = {
    bit: false,
    distance: 0,
    speed: 0,
    altitude: 0,
    ticks: 0
  };

  this.eventsSubscription = eventsStream.subscribe((s) => {
    try {
      switch(s.name) {
        case 'CpuLoad':
          drawCpu(driver, s.value);
          break;

        case 'Ticks':
          displayState.ticks = s.value[0];    // wait for gps to draw time
          displayState.bit = !displayState.bit;
          drawBit(driver, displayState.bit);
          break;

        case 'Gps':

          // distance
          displayState.distance = state.distance;

          // speed
          var speed = s.value ? s.value.speed : 0;
          if(!speed || speed < SpeedThreshold) speed = 0;
          displayState.speed = mpsTokph(speed);
  
          // altitude
          displayState.altitude = s.value ? s.value.altitude : '-';

          // draw!
          render(driver, displayState);

          break;
      }
    } catch(e) {
      console.log('driver.draw.err!', { err: e.toString, stack: e.stack });
    }
  });


  // initial state
  if(state) {
    displayState.distance = state.distance;
    render(driver, displayState);
  }

  // refresh screen
  (function redraw(self) {
    driver.display();
    self.timeout = setTimeout(redraw.bind(null, self), refreshDisplayDelay);
  })(this);

  // graph functions
  function render(driver, values) {
    console.log('render', values);

    driver.fillRect(0, 6, width, height - 10, 0);

    // speed
    driver.setTextColor(1, 0);
    driver.setCursor(4, 6);
    driver.setTextSize(2);
    var sKph = toFixed(values.speed, 1); 
    write(driver, sKph);

    // altitude
    driver.setTextColor(1, 0);
    driver.setCursor(4, 24);
    driver.setTextSize(1);
    var altText = !isNaN(values.altitude) ? (toFixed(values.altitude, 1)  + ' m') : '-';
    write(driver, 'A:' + altText);

    // time
    var elapsed = Math.round(values.ticks / 1000);
    driver.setTextColor(1, 0);
    driver.setCursor(4, height - 22);
    driver.setTextSize(1);
    write(driver, formatTime(elapsed));

    // distance
    driver.setTextColor(1, 0);
    driver.setCursor(4, height - 12);
    driver.setTextSize(1);
    write(driver, toFixed(values.distance, 1) + ' km');
  }

  function drawBit(driver, bit) {
    driver.fillRect(0, 124, 4, 4, bit ? 1 : 0);
  }

  var maxBarWidth = width - 2;
  function drawCpu(driver, cpuState) {
    driver.fillRect(0, 0, height, 4, true);
    var cpu = cpuState[0] < 2 ? cpuState[0] : 2;
    var cpuWidth = Math.round((maxBarWidth / 2) * (cpu));
    driver.fillRect(cpuWidth + 1, 1, maxBarWidth - cpuWidth - 1, 2, false);
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

function formatTime(ticks) {
  var hh = Math.floor(ticks / 3600);
  var mm = Math.floor((ticks % 3600) / 60);

  return pad(hh, 2) + ':' + pad(mm, 2);
}

function pad(n, width) {
  var n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

module.exports = DistanceDisplay;