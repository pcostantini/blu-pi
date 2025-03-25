// read config
log('!1. reading config...');
var config = require('./config');
console.log('\tblu-pi!', config);

// display drivers
console.log('!2. driver displays');
var displayDrivers = config.displayDrivers.map(instantiateDriver);
var displayDriver = global.displayDriver = getUnifiedDriver(displayDrivers);
displayDriver.invert();
displayDriver.display();

// Helpers
var x = 6;
var y = 6;
function log(msg, arg) {

  if (typeof arg !== 'undefined') {
    console.log(msg, arg);
  } else {
    console.log(msg);
  }

  if (displayDriver) {
    y = y + 6;
    displayDriver.drawPixel(x, y, 1);
    displayDriver.drawPixel(x + 1, y + 1, 1);
    displayDriver.drawPixel(x, y + 1, 1);
    displayDriver.drawPixel(x + 1, y, 1);
    displayDriver.display();
  }
}

function instantiateDriver(driverName) {
  console.log('..initing: ' + driverName);
  var DriverType = require(driverName);
  try {
    var driverInstance = new DriverType(config.displaySize.width, config.displaySize.height);
  } catch (e) {
    console.log('instantiateDriver:error!', e)
    return {
      inited: () => true,
      clear: () => true,
      display: () => true,
      drawPixel: (x, y, color) => true,
      invert: (invert) => false,
      setRotation: (rotation) => true,
      dim: (dimmed) => true
    };
  }

  return driverInstance;
}

function getUnifiedDriver(drivers) {
  return {
    inited: () => (drivers.filter((d) => d.inited).length) === drivers.length,
    clear: () => drivers.forEach((d) => d.clear()),
    display: () => drivers.forEach((d) => d.display()),
    drawPixel: (x, y, color) => drivers.forEach((d) => d.drawPixel(x, y, color)),
    invert: (invert) => drivers.filter((d => !!d.invert))
      .forEach((d) => d.invert(invert)),
    setRotation: (rotation) => drivers.forEach((d) => d.setRotation(rotation)),
    dim: (dimmed) => drivers.forEach((d) => d.dim(dimmed))
  };
}

const delay = (ms, f) => setTimeout(f, ms);

// continue app init after display drivers are started
delay(1000, function () {

  log('!3. importing stuff...');

  var Rx = require('rxjs');

  // a global hack!
  var globalEvents = global.globalEvents = Rx.Observable.create((observer) => {
    global.globalEvents_generator = observer;
  }).share();

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

  log('!3. importing more stuff...');

  require('hotswap')
  var Clock = require('./sensors/clock')
  var Ticks = require('./sensors/ticks');
  var SensorsBootstrap = require('./bootstrap_sensors');
  var Persistence = require('./persistence');
  var Display = require('./display');
  var StateReducer = require('./state');
  var ReplayWithSchedule = require('./replay_scheduled');

  // input
  log('!4. input(s) init');
  var inputDrivers = config.inputDrivers.map((driverName) => {
    console.log('..initing input: ' + driverName);
    try {
      return require(driverName)();
    } catch (e) {
      console.log('init.err!', e);
      return Rx.Observable.empty();
    }
  });
  // add timestamp to input events
  var input = Rx.Observable.from(inputDrivers)
    .mergeAll()
    .map((s) => ({ name: s.name, value: Date.now() }));

  // storage
  log('!5. persistence', config.persist);
  var db = new Persistence(config.dbFile);

  // continue previous session
  log('!6. reading previous session');
  var replay = db.readSensors();
  var replayComplete = replay.count().share();

  // load previous session
  // or load replay
  replay = !config.demoScheduled
    ? replay
    : ReplayWithSchedule(replay.filter(s => s.name !== 'Error'));

  log('!6. sensors init');
  var sensors = config.demo
    // no sensors on demo mode
    ? Rx.Observable.empty()
    // init sensors and skip until previous session read is complete
    : SensorsBootstrap(config.sensors).skipUntil(replayComplete).share()

  // persistence
  if (config.persist) {
    errors.subscribe(e => db.insert(e));
    sensors.subscribe(e => db.insert(e));
  }

  // clock and ticks
  var clock = Clock();
  var ticks = Ticks(clock);

  // merge all events
  var all = Rx.Observable
    .merge(errors, clock, ticks, input, replay, sensors, globalEvents)
    .share();

  // state + averages
  log('!7. state reducers');
  var state = StateReducer.FromStream(all);

  // state store
  var stateStore = (function () {
    var stateScan = null;
    state
      .filter(s => s.name === 'State')
      .subscribe(s => stateScan = s.value);
    return {
      getState: () => stateScan
    }
  })();

  // DISPLAY
  var allPlusState = Rx.Observable.merge(all, state).share();
  replayComplete.subscribe((cnt) => {
    log('!8. processed %s events', cnt);
    log('!9. init displays');
    ui = Display(displayDriver, config.displaySize, allPlusState, stateStore);
  });

  // Preview State
  input
    .filter((e) => e.name === 'Input:Space')
    .subscribe(() => {

      const state = stateStore.getState();

      // compact averages and path
      const averagesJson = JSON.stringify(state.Averages);
      const averagesTrunk = averagesJson.substring(averagesJson.length - 330)
      const stateCopy = {
        ...state,
        Path: (state.Path || []).length,
        Averages: averagesTrunk,
        IntervalsCount: (state.Intervals || []).length
      };

      console.log(JSON.stringify(stateCopy, null, '  '));
    });

  log('!0. Ready');
});