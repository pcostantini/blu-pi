console.log('!1. importing stuff...');
var Rx = require('rxjs');
var hotswap = require('hotswap');
console.log('!2. importing more stuff...');
var SensorsBootstrap = require('./bootstrap_sensors');
var ReplaySensors = require('./replay_sensors');
var Persistence  = require('../persistence');
var Display = require('./display');
var StateReducer = require('./state');
var Ticks = require('./sensors/ticks');

console.log('!3. reading config...');
var config = require('./config');
console.log('\tblu-pi!', config);

// input with ts
console.log('!4. input init');
var input = config.inputDriver()
				  .map((s) => ({ name: s.name, value: Date.now() }));

// sensors
console.log('!5. sensors init type: ', config.demoMode ? 'REPLAY!' : 'device')
var sensors = !config.demoMode
  ? SensorsBootstrap(config.sensors)
  : ReplaySensors(config.dbFile, config.demoScheduled);

// persistence
console.log('!6. persistence?', config.persist);
if(config.persist) {
  var db = Persistence(config.dbFile);
  sensors.subscribe(db.insert);
}

// clock, ticks and input
console.log('!7. state reducers', config.persist);
var clock = sensors.filter(s => s.name === 'Clock');
var ticks = Ticks(clock);
var all = Rx.Observable.merge(input, sensors, ticks)
var state = StateReducer.FromStream(all);
var allPlusState = Rx.Observable.merge(all, state);

// state store // defeats the purpuse!
var stateStored = null;
allPlusState.filter((s) => s.name === 'State')
   .subscribe((s) => stateStored = s.value);
var stateStore = {
	getState: () => stateStored
};

// DISPLAY
console.log('8. init displays')
var ui = Display(config.displayDriver, allPlusState, stateStore);

// STATE LOG
if(config.logState) {
  state
    .throttle(ev => Rx.Observable.interval(1000))
    .subscribe(console.log);
}


// web server + api
// var server = require('../server')(db);
// ...

