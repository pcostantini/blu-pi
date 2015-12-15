// OLED
var OLEDPI = require('./oled-js-pi');
var font = require('oled-font-5x7');

var oled = null;

function displayState(state) {

  // console.log(JSON.stringify(state, null, '\t'));

  var title = [
  state.time
  ].join('');

  var status = [
  'TMP:',
  Math.round(state.temp),
  '* | CPU:',
  Math.round(state.cpu * 1000) / 1000 
  ].join('');

  var main = {
    display: "HELLO WORLD!"
  }

  display(title, main, status);

}

function display(title, main, status) {
  if(oled == null) {
    oled = new OLEDPI({
      width: 128,
      height: 64,
      address: 0x3D,
      device: '/dev/i2c-1'
    });

    oled.turnOnDisplay();
    oled.dimDisplay(false);
    oled.clearDisplay();
  }

  oled.fillRect(0, 0, 127, 7, 0, false);
  oled.setCursor(0, 0);
  oled.writeString(font, 1, title, false, false, false);

  oled.fillRect(0, 57, 127, 7, 0, false);
  oled.setCursor(0, 57);
  oled.writeString(font, 1, status, false, false, false);

  if (typeof(main.display) === 'string') {
    console.log()
    oled.setCursor(0, 11);
    oled.writeString(font, 2, main.display, false, true, false);    
  }

  oled.drawLine(0, 9, 127, 9, true, false);
  oled.drawLine(0, 55, 127, 55, true, false);

  oled.update();
}

// cleanup
process.on('exit', function() {
  if (oled != null) {
    console.log('CLEANUP:OLED');
    oled.clearDisplay(true);
    oled = null;
  }

  // process.exit();
});


module.exports = {
  display: display,
  displayState: displayState
};