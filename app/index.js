// read config
log('!1. reading config...');
var config = require('./config');
console.log('\tblu-pi!', config);

// TODO: emit 'config' event using config object

// display drivers
console.log('!2. driver displays');
var displayDrivers = config.displayDrivers
  .map((driverName) => {
    console.log('..instantiating: ' + driverName);
    var DriverType = require(driverName);
    try {
      var driverInstance = new DriverType(config.displaySize.width, config.displaySize.height);
    } catch(e) {
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
  });

var unifiedDisplayDriver = getUnifiedDriver(displayDrivers);
global.displayDriver = unifiedDisplayDriver;

// continue app init after display drivers are started
delay(333, function () {

  log('!3. importing stuff...');
  var _ = require('lodash');
  var Rx = require('rxjs');
  var hotswap = require('hotswap');

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
    var driver = require(driverName);
    var driverInstance = driver();
    return driverInstance;
    } catch(e) {
      // console.log('init.err!', e);
      return Rx.Observable.empty();
    }
  });
  var input = Rx.Observable.from(inputInstances)
    .mergeAll()
    .map((s) => ({ name: s.name, value: Date.now() }));

  input.subscribe(console.log);

  // storage
  log('!5. storage', config.persist);
  var db = new Persistence(config.dbFile);

  // continue previous session
  log('!6. reading previous session');
  var replay = db.readSensors();
  var replayComplete = replay.count();
  replay = config.demoScheduled ? ReplayWithSchedule(replay) : replay;

  // sensors, do not activate the stream until replay is complete
  log('!6. sensors init');
  var sensors = config.demoScheduled
    ? Rx.Observable.empty()
    : SensorsBootstrap(config.sensors).skipUntil(replayComplete).share();

  // persist
  if (config.persist) {
    errors.subscribe(e => db.insert(e));
    sensors.subscribe(e => db.insert(e));
  }

  // clock, ticks and input
  var sensorsAndReplay = Rx.Observable.merge(replay, sensors);
  var clock = sensors.filter(s => s.name === 'Clock');
  var ticks = Ticks(clock);
  var all = Rx.Observable.merge(errors, input, sensorsAndReplay, ticks)
    .share();

  // state store or snapshot of latest events // defeats the purpose!
  log('!7. state reducers');
  var state = StateReducer.FromStream(all);
  var allPlusState = Rx.Observable.merge(all, state);

  // state store
  var stateStored = null;
  var stateStore = {
    set: (state) => stateStored = state,
    getState: () => stateStored
  };
  allPlusState.filter((s) => s.name === 'State')
    .subscribe((s) => stateStore.set(s.value));
  

  // DISPLAY
  var ui = null;
  replayComplete.subscribe((cnt) => {
    log('!8. processed %s events', cnt);
    log('!9. init displays. NOT!');
    ui = Display(unifiedDisplayDriver, config.displaySize, input, allPlusState, stateStore);
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
      console.log('State.Averages', _.keys(state.Averages).map(k => ({ 
        Step: k,
        Points: state.Averages[k].length
      })));


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

  if (unifiedDisplayDriver && unifiedDisplayDriver.inited()) {
    y = y + 6;
    unifiedDisplayDriver.drawPixel(x, y, 1);
    unifiedDisplayDriver.drawPixel(x + 1, y + 1, 1);
    unifiedDisplayDriver.drawPixel(x, y + 1, 1);
    unifiedDisplayDriver.drawPixel(x + 1, y, 1);
    unifiedDisplayDriver.display();
  }
}

function delay(time, func) {
  setTimeout(func, time);
}

function getUnifiedDriver(drivers) {
  return {
    inited: () => (displayDrivers.filter((d, ix) => d.inited).length) === displayDrivers.length,
    clear: () => displayDrivers.map((d) => d.clear()),
    display: () => displayDrivers.map((d) => d.display()),
    drawPixel: (x, y, color) => displayDrivers.map((d) => d.drawPixel(x, y, color)),
    invert: (invert) => displayDrivers.map((d) => d.invert(invert)),
    dim: (dimmed) => displayDrivers.map((d) => d.dim(dimmed))
  };
}

