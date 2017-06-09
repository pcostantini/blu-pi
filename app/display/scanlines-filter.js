module.change_code = 1;

function Scanlines(driver, mode) {

  var scanlineMode = mode == 1
    ? (x, y, color) => x % 2 === 1
    : (x, y, color) => x % 2 === 1 || (x + y) % 2 === 0;

  driver._drawPixel = driver.drawPixel;

  driver.drawPixel = function (x, y, color) {
    if (scanlineMode(x, y, color)) {
      driver._drawPixel(x, y, color);
    }
  };

  return {
    dispose: function () {
      if (driver._drawPixel) {
        driver.drawPixel = driver._drawPixel;
        delete driver._drawPixel;
      }
    }
  };
}

module.exports = Scanlines;