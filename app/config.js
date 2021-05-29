var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));

var demoFile = argv.demoFile;
var demoScheduled = !!argv.demoScheduled
var demoMode = argv.demo || argv.d || !!demoFile;
var persist = !demoMode;
var displaySize = { width: 128, height: 64 };

if (!demoFile) {
  // https://www.strava.com/activities/508017565
  demoFile = './data/sensors-1456895867978-TestRideParqueSarmiento.sqlite3'
}

var config = {
  displaySize: displaySize,
  demoMode: demoMode,
  demoScheduled: demoScheduled,
  persist: persist,
  inputDrivers: [
    './inputs_rotary_encoder',
    './inputs_console'
  ],
  displayDrivers: [
    './display/drivers/oled',
    './display/drivers/web'
  ],
  dbFile: demoMode
    ? demoFile
    : `./data/current.sqlite3`,
  sensors: {
    // indiscreet: {
    //   wifi: 5000
    // },
    // temperature: 3000,
    bleSensors: {
      cadence: 'e7:5e:d5:4f:11:1d',
    },
    lsm303: {
      acceleration: 0,
      axes: 0,
      heading: 1000,
      temp: 3000
    },
    cpu: 3000,
    memory: 10000
  },
};

module.exports = config;
