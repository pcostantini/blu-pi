var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));

var demoFile = argv.demoFile;
var demoMode = argv.demo || argv.d || !!demoFile;
var webDisplay = argv.webDisplay || argv.wd;
var consoleInput = argv.consoleInput || argv.c;
var demoScheduled = argv.demoScheduled !== 'false'; // ?? document!
var logState = argv.log || argv.consoleLog;

if(!demoFile) {
  // https://www.strava.com/activities/508017565
  demoFile = './data/sensors-1456895867978-TestRideParqueSarmiento.sqlite3'
}

var config = {
  logState: logState,
  demoMode: demoMode,
  demoScheduled: demoScheduled,
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
      acceleration: 0,
      axes: 0,
      heading: 500,
      temp: 3000
    },
    cpu: 3000,
    temperature: 3000,
    memory: 15000
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
