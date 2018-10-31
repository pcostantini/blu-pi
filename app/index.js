// read config
log('!1. reading config...');
var config = require('./config');
console.log('\tblu-pi!', config);

// display drivers
console.log('!2. driver displays');
var displayDriver = global.displayDriver =
  getUnifiedDriver(
    config.displayDrivers
      .map(instantiateDriver));

// continue app init after display drivers are started
delay(333, function () {

  log('!3. importing stuff...');
  var _ = require('lodash');
  var Rx = require('rxjs');
  var hotswap = require('hotswap');
  var utils = require('./utils');

  // a global hack!
  global.globalEvents = Rx.Observable.create((observer) => {
    global.globalEvents_generator = observer;
  }).share();

  log('!3. importing more stuff...');
  var SensorsBootstrap = require('./bootstrap_sensors');
  var Persistence = require('./persistence');
  var Display = require('./display');
  var StateReducer = require('./state');
  var Ticks = require('./sensors/ticks');
  var ReplayWithSchedule = require('./replay_scheduled');

  // error handling
  var errors = Rx.Observable.create(function (observer) {
    process.on('uncaughtException', function (err) {
      var data = {
        message: err.toString(),
        stack: err.stack
      };
      console.log('ERROR!:');
      console.log('!\t' + data.message);
      console.log('!\t', data.stack);
      observer.next({ name: 'Error', value: data, timestamp: Date.now() });
    });
  });

  // input with ts
  log('!4. input(s) init');
  var inputInstances = config.inputDrivers.map((driverName) => {
    console.log('..initing input: ' + driverName);
    try {
      var Driver = require(driverName);
      return Driver();
    } catch (e) {
      // console.log('init.err!', e);
      return Rx.Observable.empty();
    }
  });
  var input = Rx.Observable.from(inputInstances)
    .mergeAll()
    .map((s) => ({ name: s.name, value: Date.now() }));

  input.subscribe(console.log);

  // storage
  log('!5. persistence', config.persist);
  var db = new Persistence(config.dbFile);

  // continue previous session
  log('!6. reading previous session');
  var replay = db.readSensors();
  var replayComplete = replay.count();

  replay = config.demoScheduled ? ReplayWithSchedule(replay) : replay;

  log('!6. sensors init');
  var sensors = !config.demoScheduled
    // do not activate the stream until replay is complete
    ? SensorsBootstrap(config.sensors).skipUntil(replayComplete).share()
    // ignore sensors on replay
    : Rx.Observable.empty();

  // persistence
  if (config.persist) {
    errors.subscribe(e => db.insert(e));
    sensors.subscribe(e => db.insert(e));
  }

  // clock, ticks and input
  var clock = require('./sensors/clock')()
    .skipUntil(replayComplete)
    .share();
  var ticks = Ticks(clock);

  var gpsTicks = replay.filter(utils.isValidGpsEvent).share();
  if(config.demoMode && !config.demoScheduled) {
    Rx.Observable.merge(gpsTicks.first(), gpsTicks.last())
      .startWith([])
      .scan((acc, o) => acc.concat(o.timestamp))
      .last()
      .subscribe(acc => ticks.reset(Date.now() - (acc[1] - acc[0])));
  } else if(!config.demoMode) {
    // restart ticks using first valid gps event or current timestamp
    gpsTicks
      .take(1).map(o => o.value.timestamp)
      .defaultIfEmpty(Date.now)
      .subscribe(ts => ticks.reset(ts));
  }

  var all = Rx.Observable
    .merge(errors, clock, ticks, input, replay, sensors, global.globalEvents)
    .share();

  // state store or snapshot of latest events // defeats the purpose!
  log('!7. state reducers');
  var state = StateReducer.FromStream(all);

  // state store
  var stateStored = null;
  var stateStore = {
    set: (state) => stateStored = state,
    getState: () => stateStored
  };
  state
    .filter(s => s.name === 'State')
    .subscribe(s => stateStore.set(s.value));


  // DISPLAY
  var ui = null;
  var allPlusState = Rx.Observable.merge(all, state);
  replayComplete.subscribe((cnt) => {
    log('!8. processed %s events', cnt);
    log('!9. init displays. NOT!');
    ui = Display(displayDriver, config.displaySize, allPlusState, stateStore);
  });

  // STATE LOG
  if (config.logState) {
    state
      .throttle(ev => Rx.Observable.interval(1000))
      .subscribe(console.log);
  }

  input.filter((e) => e.name === 'Input:Space')
    .subscribe(() => {
      var state = stateStore.getState();
      console.log(
        'State',
        _.omitBy(state, (s, key) => key === 'Averages' || key === 'Path'));

      console.log('State.Path', { length: state.Path ? state.Path.length : 0 });
      // console.log('State.Averages', _.keys(state.Averages).map(k => ({
      //   Step: k,
      //   Points: state.Averages[k].length
      // })));


    });

  log('!. =)');
});

var x = 6;
var y = 6;
function log(msg, arg) {

  if (typeof arg !== 'undefined') {
    console.log(msg, arg);
  } else {
    console.log(msg);
  }

  if (displayDriver && displayDriver.inited()) {
    y = y + 6;
    displayDriver.drawPixel(x, y, 1);
    displayDriver.drawPixel(x + 1, y + 1, 1);
    displayDriver.drawPixel(x, y + 1, 1);
    displayDriver.drawPixel(x + 1, y, 1);
    displayDriver.display();
  }
}

function delay(time, func) {
  setTimeout(func, time);
}

function instantiateDriver (driverName) {
  console.log('..instantiating: ' + driverName);
  var DriverType = require(driverName);
  try {
    var driverInstance = new DriverType(config.displaySize.width, config.displaySize.height);
  } catch (e) {
    // console.log('error', e)
    return {
      inited: () => true,
      clear: () => true,
      display: () => true,
      drawPixel: (x, y, color) => true,
      invert: (invert) => false,
      dim: (dimmed) => true
    };
  }

  return driverInstance;
}

function getUnifiedDriver(drivers) {
  return {
    inited: () => (drivers.filter((d, ix) => d.inited).length) === drivers.length,
    clear: () => drivers.map((d) => d.clear()),
    display: () => drivers.map((d) => d.display()),
    drawPixel: (x, y, color) => drivers.map((d) => d.drawPixel(x, y, color)),
    invert: (invert) => drivers.map((d) => d.invert(invert)),
    dim: (dimmed) => drivers.map((d) => d.dim(dimmed))
  };
}
