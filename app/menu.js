var _ = require('lodash');
var exec = require('child_process').exec;

var menu = [  
  {
    name: '.',
    type: 'func',
    command: function() { }
  }, {
    name: 'kill_leds',
    type: 'bash',
    command: 'sudo echo 0 >/sys/class/leds/led0/brightness\n' +
          'sudo echo 0 >/sys/class/leds/led1/brightness'
  }, {
    name: 'wifi_off',
    type: 'bash',
    command: 'sudo ifdown wlan0' 
  }, {
    name: 'wifi_reset',
    type: 'bash',
    command: 'sudo ifdown wlan0\n' +
          'sudo ifup wlan0' 
  }, {
    name: 'reboot',
    type: 'bash',
    command: 'sudo reboot'
  }, {
    name: 'shutdown',
    type: 'bash',
    command: 'sudo shutdown -h -H -t 0 0'
  }, {
    name: 'tetris',
    type: 'func',
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
  var output = getExecFunc(menuItem).call();
}

function getExecFunc(menuItem) {
  switch(menuItem.type) {

    case 'bash':
      return function() {
        var cmd = menuItem.command;
        return function() {
          exec(cmd, (error, stdout, stderr) => {
              if (error) {
                console.log('exec error: ' + error);
              }
              console.log('stdout: ' + stdout);
              console.log('stderr: ' + stderr);
          });
        }
      }

    case 'func':
      return menuItem.command;  // ... ?

    default:
      // unhandled!
      return function() {
        console.log('UNRECOGNIZED.MENU_TYPE:' + menuItem.type, menuItem.command);
      }
  } 
}