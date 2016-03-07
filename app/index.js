var _ = require('underscore');
var Rx = require('rx');

// for debugging leaks
// // require('heapdump'); 

// init
var sessionId = new Date().getTime();
var config = {
  persist: true,
  persistBuffer: 0,
  sessionId: sessionId,
  dbFile: 'sensors-' + sessionId + '.sqlite3',
  sensors: {
    // refresh times
    lsm303: {
      acceleration: 1000,
      axes: 1000,
      heading: 1000,
      temp: 1000
    }
  }
};

console.log('blu-pi!', config);

// inputs
// var inputs = require('./inputs');
var inputs = Rx.Observable.empty();
inputs.subscribe(console.log);

// sensors
var sensors = require('./bootstrap_sensors')(config.sensors);
var db;
if(config.persist) {

  var useBufferedPersistence = config.persistBuffer > 0;
  var persistence = useBufferedPersistence
    ? require('../persistence/session_buffered') 
    : require('../persistence/session');

  db = useBufferedPersistence
    ? persistence.OpenDb(config.dbFile, config.persistBuffer)
    : persistence.OpenDb(config.dbFile);

  // persist with timestamp
  sensors
    .select(function(sensorEvent) {
      return _.extend(
        { timestamp: new Date().getTime() },
        sensorEvent);
    })
    .subscribe(db.insert);
}



// var screens = [
//   'screensaver', // dummy stuff
//   'ticks',       // time and distance
//   'speed',       // current speed values (gps, odometer, cadence)
//   'intervals',
// ];

var ticks = require('./sensors/ticks')();
var all = Rx.Observable.merge(ticks, sensors, inputs);
// all.subscribe(console.log)

var Display = require('./display');
var ui = Display(all);

// REPL support
// initRepl(app);
// function initRepl(app) {
//   var replify = require('replify');
//   replify('pi-blu', app);
//   console.log('REPL READY!: nc -U /tmp/repl/pi-blu.sock');
// }

// web server + api
var server = require('../server')(db);

// GC COLLECTION - TODO: REVIEW IS REALLY NEEDED
var gcWaitTime = 60000; // 1'
(function gc() {
  if (global.gc) {
    console.log('...GC!');
    global.gc();
    setTimeout(gc, gcWaitTime);
  } else {
    console.log('Garbage collection unavailable.  Pass --expose-gc '
      + 'when launching node to enable forced garbage collection.');
  }
})();


