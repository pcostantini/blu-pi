module.change_code = 1;

function Noisy(driver) {
  // rewrite drivers draw pixel
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
}


function randOffset(x, y) {
  var min = -3;
  var max = 3;
  return {
    x: x + (Math.random() * (max - min) + min),
    y: y + (Math.random() * (max - min) + min)
  };
}

module.exports = Noisy;