var _ = require('lodash');
var Rx = require('rxjs');

module.exports.FromStream = function FromStream(events) {
  var gpsEvents = events
    .filter(hasValidGpsSignal)     // TODO: something inserted BAD gps points!
    .map(s => s.value)
    .share();

  // calculate and reduce main stream of events
  // into new (reduced) values
  var reducers = Rx.Observable.merge(
    AverageRange(getSensor(events, 'CpuTemperature'), 'CpuTemperature', 30, 65, (sValue) => sValue),
    AverageRange(getSensor(events, 'CpuLoad'), 'CpuLoad', 0, 2, (sValue) => sValue[0]),
    AverageRange(gpsEvents, 'Speed', 0, 45, (sValue) =>
      sValue.speed || 0),
    PathReducer(gpsEvents),
    DistanceReducer(gpsEvents)).share();

  // merge each sendor and reduced values
  // into state and generate new 'state' event stream
  var state = {};
  var stateStream = Rx.Observable.merge(events, reducers)
    .scan((state, e) => {
      state[e.name] = e.value;
      return state;
    }, state)
    .map((state) => ({ 'name': 'State', 'value': state }))
    .share();

  // combine single reduced values and state
  return Rx.Observable.merge(
    reducers,
    stateStream).share();
}

const hasValidGpsSignal = s => !!s.value && s.value.point && s.value.point[0] !== null && s.name === 'Gps';

function DistanceReducer(gpsEvents) {
  // take gps events and calculate distance
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

function AverageRange(events, sensorName, min, max, valueSelector) {
  return Rx.Observable.merge(
    Average(events, sensorName, min, max, valueSelector, 1),
    Average(events, sensorName, min, max, valueSelector, 3),
    Average(events, sensorName, min, max, valueSelector, 5),
    Average(events, sensorName, min, max, valueSelector, 8),
    Average(events, sensorName, min, max, valueSelector, 13),
    Average(events, sensorName, min, max, valueSelector, 21),
    Average(events, sensorName, min, max, valueSelector, 34));
}

var rowHeight = 164;
function Average(events, sensorName, min, max, valueSelector, bufferCount) {
  return events
    .map(valueSelector)
    .bufferCount(bufferCount)
    .map(buf => _.reduce(buf, average, 0))
    .map(avg => [avg, calculateWidth(avg, min, max)])
    // .do(console.log)
    .scan((acc, row) => {
      acc = _.takeRight(acc, rowHeight - 1);
      acc.push(row);
      return acc;
    }, [])
    .map(dataColumn => ({
      name: ['Average', bufferCount, sensorName].join('_'),
      value: {
        length: dataColumn.length,
        dataColumn: dataColumn
      }
    }))
  // .do(console.log)
}

function getSensor(events, sensorName) {
  return events
    .filter(s => s.name === sensorName)
    .map(s => s.value);
}

function average(a, m, i, p) {
  return a + m / p.length;
}

var pixelWidth = 10;
function calculateWidth(val, min, max) {
  return Math.round(
    (pixelWidth / (max - min)) * (val - min));
}