var _ = require('lodash');
var exec = require('child_process').exec;

var dimmed = false;
var paused = false;
var menu = [
  {
    name: 'dim',
    command: () => {
      dimmed = !dimmed;
      global.displayDriver.dim(dimmed);
    }
  }, /*{
    name: 'led-',
    command: bash(
      'sudo echo 0 >/sys/class/leds/led0/brightness\n' +
      'sudo echo 0 >/sys/class/leds/led1/brightness')
  },*/ {
    name: 'restart',
    command: () => process.exit()
  }, {
    name: 'cycle db',
    command: () => {
      var fs = require('fs');
      fs.writeFile('./cycle.forced', '', () => {
        process.exit(0);
      });
    }
  }, {
    name: 'wif-r',
    command: bash(
      'sudo ifdown wlan0\n' +
      'sudo ifup wlan0')
  }, {
    name: 'rebut',
    command: () => {
      bash('sudo reboot')();
      process.exit(0);
    }
  }, {
    name: 'off',
    command: () => {
      bash('sudo reboot')();
      bash('sudo shutdown -h -H -t 0 0')();
    }
  }/*, {
    name: 'tetris',
    command: function () {
      var TetrisDisplay = require('./display/tetris.js');

      global.globalEvents_generator.next({
        type: 'change_display',
        value: TetrisDisplay
      })
    }
  }*/
];

module.exports = menu;

// function executeItem(menuItem) {
//   console.log('running menuItem', menuItem);
//   var output = menuItem.command();
// }

function bash(cmd) {
  return () => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.log('exec error: ' + error);
      }
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
    });
  }
}