// global error handling
process.on('uncaughtException', function (err) {
  console.log('ERROR!:');
  console.log('!\t' + err.toString());
  console.log('!\t', err.stack);
});

// read config
log('!1. reading config...');
var config = require('./config');
console.log('\tblu-pi!', config);

// display drivers
console.log('!2. driver displays');
var displayDrivers = config.displayDrivers
  .map((driverName) => {
    console.log('..instantiating: ' + driverName);
    var driverCtor = require(driverName);
    var driverInstance = new driverCtor(config.size.width, config.size.height);
    return driverInstance;
  });

var unifiedDisplayDriver = getUnifiedDriver(displayDrivers);

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

  // input with ts
  log('!4. input(s) init');
  var inputInstances = config.inputDrivers.map((driverName) => {
    console.log('..initing input: ' + driverName);
    var driver = require(driverName);
    var driverInstance = driver();
    return driverInstance;
  });
  var input = Rx.Observable.from(inputInstances)
    .mergeAll()
    .map((s) => ({ name: s.name, value: Date.now() }));

  input.subscribe(console.log)

  // storage
  log('!5. storage', config.persist);
  var db = new Persistence(config.dbFile);

  // continue previous session
  log('!6. reading previous session');
  var replay = db.readSensors();
  var replayComplete = replay.count();

  // sensors, do not activate the stream until replay is complete
  log('!6. sensors init');
  var sensors = SensorsBootstrap(config.sensors)
    .skipUntil(replayComplete).share();

  // persist
  if (config.persist) {
    sensors.subscribe((event) => db.insert(event));
  }

  // clock, ticks and input
  var sensorsAndReplay = Rx.Observable.merge(replay, sensors);
  var clock = sensors.filter(s => s.name === 'Clock');
  var ticks = Ticks(clock);
  var all = Rx.Observable.merge(input, sensorsAndReplay, ticks)
    .share();

  // state store or snapshot of latest events // defeats the purpuse!
  log('!7. state reducers');
  var state = StateReducer.FromStream(all);
  var allPlusState = Rx.Observable.merge(all, state);

  var stateStored = null;
  var stateStore = {
    getState: () => stateStored
  };
  allPlusState
    .filter((s) => s.name === 'State')
    .subscribe((s) => stateStored = s.value);

  // DISPLAY
  var ui = null;
  replayComplete.subscribe((cnt) => {
    log('!8. processed %s events', cnt);
    log('!9. init displays');
    ui = Display(unifiedDisplayDriver, config.size, allPlusState, stateStore);

    global.displayDriver = unifiedDisplayDriver;
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
      console.log('State.Current:',
        _.omitBy(state, (s, key) =>
          key.indexOf('Average_') === 0 || key === 'AverageGraphs' || key === 'Path'));

      console.log('State.AverageGraphs', _.keys(state.AverageGraphs));



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
    // unifiedDisplayDriver.fillRect(x, y, 2, 2, 1);
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

