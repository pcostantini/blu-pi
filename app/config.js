var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));

var demoFile = argv.demoFile;
var demoMode = argv.demo || argv.d || !!demoFile;
var webDisplay = argv.webDisplay || argv.wd;
var consoleInput = argv.consoleInput || argv.c;

if(!demoFile) {
  // https://www.strava.com/activities/508017565
  demoFile = './data/sensors-1456895867978-TestRideParqueSarmiento.sqlite3'
}

var config = {
  logState: true,
  demoMode: demoMode,
  persist: !demoMode,
  persistBuffer: 0,
  dbFile:
    demoMode ?
	demoFile :
    	'./data/current.sqlite3',
  sensors: {
    // refresh times

    //indiscreet: {
    // wifi: 5000
    //},
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
    stack: err.stack.replace(/\n/g,'$1\n') // SO!: console.log('foo!bar!baz!'.replace(/([!.?])/g,'$1\n'));
  });
});

module.exports = config;
