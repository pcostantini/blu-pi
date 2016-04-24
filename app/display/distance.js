module.change_mode = 1;

var refreshDisplayDelay = 1000;
var width = 64;
var height = 128;

function DistanceDisplay(driver, eventsStream, state) {

  driver.clear();

  var displayState = {
    bit: false,
    distance: 0,
    speed: NaN,
    altitude: NaN,
    ticks: 0
  };

  this.eventsSubscription = eventsStream.subscribe((s) => {
    try {
      switch(s.name) {

        case 'Ticks':
          displayState.ticks = s.value[0];    // wait for gps to draw time
          displayState.bit = !displayState.bit;
          drawTime(driver, displayState.ticks);
          drawBit(driver, displayState.bit);
          break;

        case 'Gps':

          // distance
          displayState.distance = state.distance;

          // speed
          var speed = s.value ? s.value.speed : '-';
          displayState.speed = speed;
  
          // altitude
          displayState.altitude = s.value ? s.value.altitude : '-';

          drawLocation(driver, displayState);

          break;
      }
    } catch(e) {
      console.log('driver.draw.err!', { err: e.toString, stack: e.stack });
    }
  });


  // initial state
  if(state) {
    displayState.distance = state.distance;
    drawLocation(driver, displayState);
    drawTime(driver, displayState.ticks);
  }

  // refresh screen
  (function redraw(self) {
    driver.display();
    self.timeout = setTimeout(redraw.bind(null, self), refreshDisplayDelay);
  })(this);

  // graph functions
  function drawLocation(driver, values) {
    console.log('render', values);

    driver.fillRect(0, 6, width, 26, 0);

    // speed
    driver.setTextColor(1, 0);
    driver.setCursor(4, 6);
    driver.setTextSize(2);
    var speed = values.speed;
    if(isNaN(speed)) {
      write(driver, '--');
    } else {
      write(driver, toFixed(mpsToKph(speed), 1));
    }

    // altitude
    driver.setTextColor(1, 0);
    driver.setCursor(4, 24);
    driver.setTextSize(1);
    var altText = !isNaN(values.altitude) ? (toFixed(values.altitude, 1)  + ' m') : '-';
    write(driver, 'A:' + altText);

    // distance
    driver.setTextColor(1, 0);
    driver.setCursor(4, height - 12);
    driver.setTextSize(1);
    write(driver, toFixed(values.distance, 1) + ' km');
  }

  function drawBit(driver, bit) {
    driver.fillRect(0, 124, 4, 4, bit ? 1 : 0);
  }

  function drawTime(driver, ticks) {
    // time
    var elapsed = Math.round(ticks / 1000);
    driver.setTextColor(1, 0);
    driver.setCursor(4, height - 22);
    driver.setTextSize(1);
    write(driver, formatTime(elapsed));
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
    this.eventsSubscription.unsubscribe();
  }

  if(this.timeout) {
    clearTimeout(this.timeout);
  }
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

module.exports = DistanceDisplay;
