var fs = require('fs');
var exec = require('child_process').exec;
var _ = require('lodash');

var dimmed = false;

module.exports = [
  {
    name: 'dim',
    command: () => {
      dimmed = !dimmed;
      global.displayDriver.dim(dimmed);
    }
  }, {
    name: 'new',
    command: () => {
      global.displayDriver.invert(true);
      bash('touch cycle.forced')()
      setTimeout(() => process.exit(0), 333);
    }
  }, {
    name: 'wif-r',
    command: () => {
      bash(['sudo ifdown wlan0',
        'sleep 1',
        'sudo ifup wlan0'].join('\n'));
    }
  }, {
    name: 'rebut!',
    command: () => {
      bash('sudo reboot')();
    }
  }, {
    name: 'OFF!',
    command: () => {
      bash('sudo shutdown -h -H -t 0 0')();
    }
  }
];


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
