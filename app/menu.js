var _ = require('lodash');
var exec = require('child_process').exec;

var menu = [
  {
    name: 'kill_leds',
    type: 'bash',
    data: 'sudo echo 0 >/sys/class/leds/led0/brightness\n' +
          'sudo echo 0 >/sys/class/leds/led1/brightness'
  }, {
    name: 'wifi_off',
    type: 'bash',
    data: 'sudo ifdown wlan0' 
  }, {
    name: 'wifi_reset',
    type: 'bash',
    data: 'sudo ifdown wlan0\n' +
          'sudo ifup wlan0' 
  }, {
    name: 'tetris',
    type: 'module',
    data: 'tetris'
  }, {
    name: 'reboot',
    type: 'bash',
    data: 'sudo reboot'
  }, {
    name: 'shutdown',
    type: 'bash',
    data: 'sudo shutdown -h -H -t 0 0'
  }
];

menu = menu.map(m => _.extend(
  {
    run: () => executeItem(m)
  }, m));

module.exports = menu;

function executeItem(menuItem) {
  console.log('running menuItem', menuItem);

  var menuFunc = getExecFunc(menuItem);
  var runResult = menuFunc();// TOD: pass context, state? or stream
}

function getExecFunc(menuItem) {
  switch(menuItem.type) {

    case 'bash':
      return function() {
        var cmd = menuItem.data;
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
              console.log('exec error: ' + error);
            }
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
        });
      }

    case 'module':
      return function() {
        // var tetrisScreen = require('./display/tetris');
      }

    default:
      // unhandled!
      return function() {
        console.log('UNRECOGNIZED.MENU_TYPE:' + menuItem.type, menuItem.data);
      }
  } 
}