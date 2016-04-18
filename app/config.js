var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));
var demoMode = argv.demo || argv.d;
var webDisplay = argv.webDisplay || argv.wd;
var consoleInput = argv.console || argv.c;

var config = {
  demoMode: demoMode,
  persist: !demoMode,
  persistBuffer: 0,
  dbFile: !demoMode
    ? './data/current.sqlite3'
    : './data/sensors-1456895867978-TestRideParqueSarmiento.sqlite3',   // https://www.strava.com/activities/508017565
  sensors: {
    // refresh times
    lsm303: {
      acceleration: 500,
      axes: 500,
      heading: 500,
      temp: 5000
    },
    temperature: 2500
  },
  displayDriver: !webDisplay
    ? require('./display/drivers/oled')
    : require('./display/drivers/web'),
  inputDriver: !consoleInput
    ? require('./inputs')
    : require('./inputs_console')
};

// global error handling
// this is due to some sensor code may throw error in async ways, not making it possible to catch
process.on('uncaughtException', err => {
  console.log('ERROR!: ', {
    err: err.toString(),
    stack: err.stack
  });
});

module.exports = config;