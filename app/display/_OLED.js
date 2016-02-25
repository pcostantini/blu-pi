var OledPi = require('./oled-js-pi');
var font = require('oled-font-5x7');
var oled = null;

function display(title, main, status) {
  try {

    if(!oled) {
      oled = new OledPi({
        width: 128,
        height: 64,
        address: 0x3D,
        device: '/dev/i2c-1'
      });
    }

    oled.turnOnDisplay();
    oled.dimDisplay(false);
    oled.clearDisplay();

    oled.fillRect(0, 0, 127, 7, 0, false);
    oled.setCursor(0, 0);
    oled.writeString(font, 1, title, false, false, false);

    oled.fillRect(0, 57, 127, 7, 0, false);
    oled.setCursor(0, 57);
    oled.writeString(font, 1, status, false, false, false);

    if (typeof(main.display) === 'string') {
      oled.setCursor(0, 11);
      oled.writeString(font, 2, main.display, false, true, false);    
    }

    oled.drawLine(0, 9, 127, 9, true, false);
    oled.drawLine(0, 55, 127, 55, true, false);

    oled.update();

  } catch(err) {
    console.log('OLED:ERR!', err);
  }
}

function displayState(state) {

  var title = [
    state.time,
    ' | ',
    Math.round(state.temp * 10) / 10, '*'
  ].join('');

  var status = [
    'CPU:', Math.round(state.cpu * 1000) / 1000,
    ' | GPS:',
    state.gpsFix ? '1' : '0'
  ].join('');

  var main = {
    display: (state.heading) ? state.heading.toString() : '0'
  };

  display(title, main, status);
}

module.exports = {
  display: display,
  displayState: displayState
};
