log('!1. reading config...');
var config = require('./config');
console.log('\tblu-pi!', config);


// global error handling
// this is due to some sensor code may throw error in async ways, not making it possible to catch
process.on('uncaughtException', function (err) {
  console.log('ERROR!:');
  console.log('!\t' + err.toString());
  console.log('!\t', err.stack);
});


// display drivers
console.log('!2. driver displays');
var displayDrivers = config.displayDrivers.map((driverName) => {
  console.log('..instantiating: ' + driverName);
  var driverCtor = require(driverName);
  var driverInstance = new driverCtor(config.size.width, config.size.height);
  return driverInstance;
});

var unifiedDisplayDriver = {
  inited: () => (displayDrivers.filter((d, ix) => d.inited).length) === displayDrivers.length,
  clear: () => displayDrivers.map((d) => d.clear()),
  display: () => displayDrivers.map((d) => d.display()),
  drawPixel: (x, y, color) => displayDrivers.map((d) => d.drawPixel(x, y, color)),
  invert: (invert) => displayDrivers.map((d) => d.invert(invert)),
  dim: (dimmed) => displayDrivers.map((d) => d.dim(dimmed))
};

// continue app init after display drivers are started
setTimeout(startApp, 250);

function startApp() {
  log('!3. importing stuff...');
  var Rx = require('rxjs');
  var hotswap = require('hotswap');
  log('!3. importing more stuff...');
  var SensorsBootstrap = require('./bootstrap_sensors');
  var ReplaySensors = require('./replay_sensors');
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

  // persistence
  log('!5. persistence', config.persist);
  var db = new Persistence(config.dbFile);

  // sensors
  log('!6. sensors init in ' + (config.demoMode ? 'REPLAY!' : 'device') + 'mode');
  var sensors = config.demoMode
    ? Rx.Observable.merge(
        ReplaySensors(db.readSensors('Gps'), config.demoScheduled),
        SensorsBootstrap(config.sensors, true))
    : SensorsBootstrap(config.sensors);

  if (config.persist) {
    sensors.subscribe((event) => db.insert(event));
  }

  // clock, ticks and input
  log('!7. state reducers', config.persist);
  var clock = sensors.filter(s => s.name === 'Clock');
  var ticks = Ticks(clock);
  var all = Rx.Observable.merge(input, sensors, ticks)
  var state = StateReducer.FromStream(all);
  var allPlusState = Rx.Observable.merge(all, state);

  // state store or snapshot of latest events // defeats the purpuse!
  var stateStored = null;
  allPlusState.filter((s) => s.name === 'State')
    .subscribe((s) => stateStored = s.value);
  var stateStore = {
    getState: () => stateStored
  };

  // DISPLAY
  console.log('!8. init displays')
  var ui = Display(unifiedDisplayDriver, config.size, allPlusState, stateStore);

  console.log('.');
  console.log('.');

  // STATE LOG
  if (config.logState) {
    state
      .throttle(ev => Rx.Observable.interval(1000))
      .subscribe(console.log);
  }
  input.filter((e) => e.name === 'Input:Space')
       .subscribe(() => console.log(stateStore.getState()));


  // web server + api
  // var server = require('../server')(db);
  // ...
}

var y = 6;
function log(msg) {
  console.log(msg);
  if (unifiedDisplayDriver && unifiedDisplayDriver.inited()) {
    var x = 6;
    y = y + 6;
    unifiedDisplayDriver.drawPixel(x, y, 1);
    unifiedDisplayDriver.drawPixel(x + 1, y + 1, 1);
    unifiedDisplayDriver.drawPixel(x, y + 1, 1);
    unifiedDisplayDriver.drawPixel(x + 1, y, 1);
    unifiedDisplayDriver.display();
  }
}