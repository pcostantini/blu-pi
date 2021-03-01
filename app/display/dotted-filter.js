module.change_code = 1;

function Dotted(driver, modifier) {
  if(!modifier) modifier = 0;
  // rewrite drivers draw pixel
  driver._drawPixelDotted = driver.drawPixel;
  driver.drawPixel = function (x, y, color) {

    if (((x + y) + modifier) % 2 === 1) {
      driver._drawPixelDotted(x, y, color);
    } /*else {
      driver._drawPixelDotted(x, y, false);
    }*/

  };

  return {
    dispose: function () {
      if (driver._drawPixelDotted) {
        // restore
        driver.drawPixel = driver._drawPixelDotted;
        delete driver._drawPixelDotted;
      }
    }
  };
}

module.exports = Dotted;