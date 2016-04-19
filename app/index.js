var Rx = require('rxjs');

require('hotswap');

var SensorsBootstrap = require('./bootstrap_sensors');
var ReplaySensors = require('./replay_sensors');
var Persistence  = require('../persistence');
var Display = require('./display');
var State = require('./state');

// init
var config = require('./config');
console.log('blu-pi!', config);

var input = config.inputDriver();

// sensors
var sensors = !config.demoMode
  ? SensorsBootstrap(config.sensors)
  : ReplaySensors(config.dbFile);

// save
if(config.persist) {
  var db = Persistence(config.dbFile);
  sensors.subscribe(db.insert);
}

// state
var state = State.FromStream(Rx.Observable.merge(input, sensors));

// all
var stateAndAll = Rx.Observable.merge(input, sensors, state);
// stateAndAll.subscribe((s) => {
// 	console.log(JSON.stringify(s, null, null));
// });

// DISPLAY
var ui = Display(config.displayDriver, stateAndAll);

// web server + api
// var server = require('../server')(db);

// for debugging leaks
// require('heapdump'); 

// REPL supportString::NewSymbol("write"),
// initRepl(all);
// function initRepl(app) {
//   var replify = require('replify');
//   replify('pi-blu', app);      
//   console.log('REPL READY!: nc -U /tmp/repl/pi-blu.sock');
// }


// ...