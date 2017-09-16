module.change_code = 1;

function Scanlines(driver, mode) {

  var scanlineMode = mode == 1
    ? (x, y, color) => x % 2 === 1                            // 1
    : (mode == 2)
      ? (x, y, color) => y % 2 === 0                          // 2
      : (x, y, color) => x % 2 === 1 || (x + y) % 2 === 0;    // 0

  driver._drawPixelScan = driver.drawPixel;

  driver.drawPixel = function (x, y, color) {
    if (scanlineMode(x, y, color)) {
      driver._drawPixelScan(x, y, color);
    }
  };

  return {
    dispose: function () {
      if (driver._drawPixelScan) {
        driver.drawPixel = driver._drawPixelScan;
        delete driver._drawPixelScan;
      }
    }
  };
}

module.exports = Scanlines;