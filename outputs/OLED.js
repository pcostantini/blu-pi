// OLED
var OledPi = require('./oled-js-pi');
var font = require('oled-font-5x7');


// var pngtolcd = require('png-to-lcd');
// pngtolcd('nyan-cat.png', true, function(err, bitmap) {
//   console.log('oled.wrn!', err)
//   console.log(bitmap);
//   // oled.buffer = bitmap;
// });

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
    ' | GPSFix:',
    state.gpsFix ? 1 : 0
  ].join('');

  var status = [
    'TMP:', Math.round(state.temp),
    '* | CPU:', state.cpu
  ].join('');

  var main = {
    display: Math.round(state.heading).toString()
  };

  display(title, main, status);
}

module.exports = {
  display: display,
  displayState: displayState
};