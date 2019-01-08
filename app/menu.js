var fs = require('fs');
var exec = require('child_process').exec;
var _ = require('lodash');

var dimmed = false;
var paused = false;

module.exports = [
  {
    name: 'dim',
    command: () => {
      dimmed = !dimmed;
      global.displayDriver.dim(dimmed);
    }
  }, {
    name: 'reload'
  }, {
    name: 'new',
    command: () => {
      fs.writeFile('./cycle.forced', '', () => {
        process.exit(0);
      });
    },
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
      // bash('sudo reboot')();
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
