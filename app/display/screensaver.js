var refreshDisplayDelay = 1000;
var width = 64;
var height = 128;

const mpsTokph = (mps) => Math.round(mps * 3.6 * 100) / 100;

module.exports = function Display(driver, eventsStream) {

  driver.clear();

  var bit = false;
  eventsStream.subscribe((s) => {
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

          // drawBackground(driver);

          var speed = s.value ? s.value.speed : 0;
          if(speed == undefined) speed = 0;
          var kmPh = mpsTokph(speed);
          writeSpeed(driver, kmPh);

          break;
      }
    } catch(err) {
      console.log('driver.draw.err!', { err: err, stack: err.stack });
    }
  });

  // refresh screen
  (function redraw() {
    driver.display();
    setTimeout(redraw, refreshDisplayDelay);
  })();

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

  function drawBackground(driver) {
    driver.fillRect(0, 4, 64, 124, false);
    driver.drawCircle(width/2, 92, getRandomArbitrary(), true);
    driver.drawLine(getRandomArbitrary(), 2, getRandomArbitrary(), 127, true);
    driver.drawLine(getRandomArbitrary(), 4, getRandomArbitrary(), 127, true);
  }

  function writeSpeed(driver, kmPh) {
    driver.setCursor(10, 6);
    driver.setTextSize(2);
    driver.setTextColor(1, 0);
    var sKph = toFixed(kmPh, 1); 
    var chars = sKph.split('');
    chars.forEach((c) => {
      driver.write(c.charCodeAt(0));
    });

  }

  function getRandomArbitrary() {
    return Math.random() * (55 - 9) + 9;
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