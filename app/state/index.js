var _ = require('lodash');
var Rx = require('rxjs');
var DistanceReducer = require('./distance');
var PathReducer = require('./path');
var utils = require('../utils');


// TODO: Extract averages to own file

// averages configuration
var averageSensorSteps = [1, 5, 30, 60, 60 * 5, 60 * 10];
var averageSensorReaders = {
  'CpuLoad': (sValue) => sValue[0],
  'CpuTemperature': (sValue) => sValue,
  'MagnometerTemperature': (sValue) => sValue.temp,
  'Gps': (sValue) => utils.mpsToKph(sValue.speed || 0)
};

var averageSensorNames = _.keys(averageSensorReaders);
var defaultValues = _.mapValues(averageSensorReaders, () => 0);
module.exports.AverageSensorSteps = averageSensorSteps;
module.exports.FromStream = function FromStream(events) {
  var gpsEvents = events
    .filter(utils.isValidGpsEvent)
    .map(s => s.value)
    .share();

  // calculate and reduce main stream of events
  // into new (reduced) values
  var reducers = Rx.Observable.merge(
    PathReducer(gpsEvents),
    DistanceReducer(gpsEvents)).share();

  // state stream (merged all reducers and events)
  var state = {};
  var stateStream = Rx.Observable.merge(events, reducers)
    .scan((state, e) => {
      state[e.name] = e.value;
      return state;
    }, state)
    .map((state) => ({ 'name': 'State', 'value': state }))
    .share();

  // every 1 snapshot capture (?)
  var oneSecSnapshot = Rx.Observable.timer(0, 1000)
    .map(() => _.pick(state, averageSensorNames))
    .map((snapshotUnnormalized) =>
      _.mapValues(snapshotUnnormalized, (value, sensor) => averageSensorReaders[sensor](value)))
    .map((snapshot) => _.assign({}, defaultValues, snapshot));

  var averagesStreams = averageSensorSteps.map(t => AverageFromSnapshot(oneSecSnapshot, averageSensorNames, t))
  var averages = Rx.Observable
    .from(averagesStreams)
    .mergeAll()
    .share();

  // Averages history
  state.Averages = {};
  averages.subscribe((avg) => {
    var history = state.Averages[avg.name];
    if(!history) {
      history = [];
    }

    history.push(avg.value);

    // limit page size
    history = history.length > 256 ? _.takeRight(history, 256) : history;

    state.Averages[avg.name] = history;
  });

  // combine all
  return Rx.Observable.merge(stateStream, reducers, averages)
    .share();
}

// AVERAGE
function AverageFromSnapshot(snapshot, sensorNames, bufferCount) {
  return snapshot
    .bufferCount(bufferCount)
    .map(buf => _.reduce(buf, (avgSnapshot, item, ix, buf) =>
      _.mapValues(item, (value, name) =>
        avgSnapshot[name] + value / buf.length),
      defaultValues))
    .map((s) => ({
      name: ['Average', bufferCount].join('_'),
      value: s
    }));
}
