var _ = require('lodash');
var exec = require('child_process').exec;

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

var menu = [  
  {
    name: 'kill leds',
    command: bash(
      'sudo echo 0 >/sys/class/leds/led0/brightness\n' +
      'sudo echo 0 >/sys/class/leds/led1/brightness')
  }, {
    name: 'cycle db',
    command: () => {
      var fs = require('fs');
      fs.writeFile('./cycle.forced', '', () => {
        process.exit(0);
      });
    }
  }, {
    name: 'wifi off',
    command: bash('sudo ifdown wlan0')
  }, {
    name: 'wifi reset',
    command: bash(
      'sudo ifdown wlan0\n' +
      'sudo ifup wlan0')
  }, {
    name: 'reboot',
    command: bash('sudo reboot')
  }, {
    name: 'shutdown',
    command: bash('sudo shutdown -h -H -t 0 0')
  }, {
    name: 'tetris',
    command: function() {
      // ha!
    }
  } 
];

module.exports = menu.map(m => _.extend(
  {
    run: () => executeItem(m)
  }, m));;

function executeItem(menuItem) {
  console.log('running menuItem', menuItem);
  var output = menuItem.command();
}