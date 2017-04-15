var _ = require('lodash');
var Rx = require('rxjs');

// averages configuration
var averageSensorReaders = {
  'CpuTemperature': (sValue) => sValue,
  'CpuLoad': (sValue) => sValue[0],
  'Gps.Speed': (sValue) => sValue.speed || 0
};

var averageSensorNames = _.keys(averageSensorReaders);
var defaultValues = _.mapValues(averageSensorReaders, () => 0);

module.exports.FromStream = function FromStream(events) {
  var gpsEvents = events
    .filter(hasValidGpsSignal)
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

  // snapshot every 1 and then average them in different time windows
  var oneSecSnapshot = Rx.Observable.timer(0, 1000)
    .map(() => _.pick(state, averageSensorNames))
    .map((snapshotUnnormalized) =>
      _.mapValues(snapshotUnnormalized, (value, sensor) => averageSensorReaders[sensor](value)))
    .map((snapshot) => _.assign({}, defaultValues, snapshot));

  var averages = Rx.Observable.merge(
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 1),
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 3),
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 5),
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 8),
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 13),
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 21),
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 34)).share()

  // Averages history
  state.Averages = {};
  averages.subscribe((avg) => {
    var history = state.Averages[avg.name];
    if(!history) {
      history = []; 
    }

    history.push(avg.value);
    history = _.takeRight(history, 256);

    state.Averages[avg.name] = history;
  });

  // combine all
  return Rx.Observable.merge(stateStream, reducers, averages)
    .share();
}

const hasValidGpsSignal = s => !!s.value && s.value.point && s.value.point[0] !== null && s.name === 'Gps';

// REDUCERS

// DISTANCE
// takes a gps stream, applies a noise filter
// returns a 'Distance' stream
function DistanceReducer(gpsEvents) {
  var GpsDistance = require('gps-distance');
  var GpsNoiseFilter = require('./gps_noise_filter');

  var distance = 0;

  return gpsEvents
    .filter(GpsNoiseFilter(GpsNoiseFilter.DefaultSpeedThreshold))
    .map(gps => [gps.latitude, gps.longitude])
    .scan((last, curr) => {
      if (last) {
        var offset = GpsDistance(last[0], last[1], curr[0], curr[1]);
        distance += offset;
      }
      return curr;
    }, null)
    .map(() => ({ name: 'Distance', value: distance }));
}


// PATH
// takes a gps stream
// returns a 'Path' stream with all points
var lastPoint = [0, 0];
function PathReducer(gpsEvents) {
  return gpsEvents
    .map(gps => [gps.latitude, gps.longitude])
    .filter(point => point[0] && point[1] && (lastPoint[0] !== point[0] || lastPoint[1] !== point[1]))
    .scan((path, point) => {
      lastPoint = point;
      path.push(point);
      return path;
    }, [])
    .map((path) => ({
      name: 'Path',
      value: { length: path.length, points: path }
    }));
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