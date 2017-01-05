module.change_code = 1;

function Dotted(driver) {
  // rewrite drivers draw pixel
  driver._drawPixel = driver.drawPixel;
  driver.drawPixel = function (x, y, color) {

    if ((x + y) % 2 === 1) {
      driver._drawPixel(x, y, color);
    }

  };

  return {
    dispose: function () {
      if (driver._drawPixel) {
        // restore
        driver.drawPixel = driver._drawPixel;
        delete driver._drawPixel;
      }
    }
  };
}

module.exports = Dotted;