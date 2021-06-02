var _ = require('lodash');
var Rx = require('rxjs');
var utils = require('../utils');

var PathReducer = require('./path');
var DistanceReducer = require('./distance').DistanceReducer;
var GpsDistanceReducer = require('./distance').GpsDistanceReducer;
var IntervalsReduder = require('./intervals');

// averages configuration
var averageSensorSteps = [
  1,      // a tick (one second)
  2,      // two ticks (seconds)
  2 * 4,
  2 * 4 * 6,
  2 * 4 * 6 * 8,
  2 * 4 * 6 * 8 * 10
];
var averageSensorConfig = {
  'CpuLoad':               ['CpuLoad', o => o[0]],
  'CpuTemperature':        ['CpuTemperature', o => o],
  'MagnometerTemperature': ['MagnometerTemperature', o => o.temp],
  'SpeedGps':              ['Gps', o => utils.mpsToKph(o.speed || 0)],
  'SpeedOdometer':         ['Odometer', o => o.speed || 0],
  'Cadence':               ['Cadence', o => o.cadence || 0]
};

var defaultValues = _.mapValues(averageSensorConfig, () => 0);
module.exports.AverageSensorSteps = averageSensorSteps;
module.exports.FromStream = function FromStream(events) {
  var gpsEvents = events
    .filter(utils.isValidGpsEvent)
    .map(s => s.value);

  // calculate and reduce main stream of events
  // into new (reduced) values
  var accumulated = Rx.Observable.merge(
    PathReducer(gpsEvents),
    GpsDistanceReducer(gpsEvents),
    DistanceReducer(events.filter(s => s.name === 'Odometer'))).share();

  accumulated = Rx.Observable.merge(
    IntervalsReduder(accumulated, gpsEvents),
    accumulated);

  // state stream (merged all reducers and events)
  var state = {};
  var stateStream = Rx.Observable.merge(events, accumulated)
    .scan((state, e) => {
      state[e.name] = e.value;
      return state;
    }, state)
    .map((state) => ({ 'name': 'State', 'value': state }))
    .share();

  // every 1 snapshot capture (?)
  var averageSensorNames = _.values(averageSensorConfig).map(g => g[0]);
  var oneSecSnapshot = Rx.Observable.timer(0, 1000)
    .map(() => _.pick(state, averageSensorNames))
    .map((snapshotUnnormalized) =>
      _.mapValues(averageSensorConfig, (config) => getFromSnapshot(snapshotUnnormalized, config)))
    .map((snapshot) => _.assign({}, defaultValues, snapshot))

  var averagesStreams = averageSensorSteps.map(bufferCount => AverageFromSnapshot(oneSecSnapshot, bufferCount))
  var averages = Rx.Observable
    .from(averagesStreams)
    .mergeAll()
    .share();

  // Averages history
  state.Averages = {};
  averages.subscribe((avg) => {
    var history = state.Averages[avg.name];
    if (!history) {
      history = [];
    }

    history.push(avg.value);

    // limit page size
    history = history.length > 256 ? _.takeRight(history, 256) : history;

    state.Averages[avg.name] = history;
  });

  // combine all
  return Rx.Observable.merge(stateStream, accumulated, averages)
    .share();
}

// AVERAGE
function AverageFromSnapshot(snapshot, bufferCount) {
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

function getFromSnapshot(snapshot, config) {
  var sensorName = config[0];
  var sensorValueFun = config[1];
  var sensorValue = snapshot[sensorName];
  return sensorValue ? sensorValueFun(sensorValue) : 0
}