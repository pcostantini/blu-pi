var refreshDisplayDelay = 1000;
var width = 64;
var height = 128;

const mpsTokph = (mps) => Math.round(mps * 3.6 * 100) / 100;

function Display(driver, eventsStream) {

  driver.clear();

  var bit = false;
  this.eventsSubscription = eventsStream.subscribe((s) => {
    try {
      switch(s.name) {
        case 'CpuLoad':
          drawCpu(driver, s.value);
          break;

        case 'Ticks':
          bit = !bit;
          drawBit(driver, bit);
          break;

        case 'Gps':
          var speed = s.value ? s.value.speed : 0;
          if(speed == undefined) speed = 0;
          var kmPh = mpsTokph(speed);
          writeSpeed(driver, kmPh);
	
          var altitude = s.value ? s.value.altitude : 0;
          if(altitude == undefined) altitude = 0
          writeAltitude(driver, altitude);

          break;
      }
    } catch(err) {
      console.log('driver.draw.err!', { err: err, stack: err.stack });
    }
  });

  // refresh screen
  (function redraw(self) {
    driver.display();
    self.timeout = setTimeout(redraw.bind(null, self), refreshDisplayDelay);
  })(this);

  // graph functions
  function drawBit(driver, bit) {
    driver.fillRect(0, 124, 4, 4, bit ? 1 : 0);
  }

  function drawCpu(driver, cpuState) {
    driver.fillRect(0, 0, height, 4, true);
    var cpu = cpuState[0] < 2 ? cpuState[0] : 2;
    var cpuWidth = Math.round((width / 2) * (2-cpu));
    driver.fillRect(cpuWidth, 1, width - cpuWidth - 1, 2, false);
  }

  function writeSpeed(driver, kmPh) {
    driver.setTextColor(1, 0);
    driver.setCursor(4, 6);
    driver.setTextSize(2);
    var sKph = toFixed(kmPh, 1); 
    write(driver, sKph);
  }

  function writeAltitude(driver, altitude) {
    driver.setTextColor(1, 0);
    driver.setCursor(4, 22);
    driver.setTextSize(1);
    write(driver, Math.round(altitude).toString())
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

Display.prototype.dispose = function() {
  if(this.eventsSubscription) {
    this.eventsSubscription.dispose();
  }

  if(this.timeout) {
    clearTimeout(this.timeout);
  }
}

module.exports = Display;