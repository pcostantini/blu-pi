module.change_code = 1;

function Noisy(driver) {
  // rewrite drivers draw pixel
  driver._drawPixel = driver.drawPixel;
  driver.drawPixel = function (x, y, color) {

    // shadow
    if (!!color)
      driver._drawPixel(x + 1, y + 1, false);

    if (
      Math.random() > .17
      || !color
    ) {

      // noise
      var r = randOffset(x, y);
      if (!!color && Math.random() > .95) {
        driver._drawPixel(r.x, r.y, color);
      }

      // draw
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


function randOffset(x, y) {
  x = x || 0;
  y = y || 0;
  var min = -3;
  var max = 3;
  return {
    x: x + (Math.random() * (max - min) + min),
    y: y + (Math.random() * (max - min) + min)
  };
}

module.exports = Noisy;