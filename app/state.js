var _ = require('lodash');
var Rx = require('rxjs');

// averages configuration
var averageSensorReaders = {
  'CpuTemperature': [30, 65, (sValue) => sValue],
  'CpuLoad': [0, 2, (sValue) => sValue[0]],
  'Gps.Speed': [0, 25, (sValue) => sValue.speed || 0]
};

var averageSensorNames = _.keys(averageSensorReaders);
var defaultValues = _.mapValues(averageSensorReaders, () => 0);

module.exports.FromStream = function FromStream(events) {
  var gpsEvents = events
    .filter(hasValidGpsSignal)     // TODO: something inserted BAD gps points!
    .map(s => s.value)
    .share();

  // calculate and reduce main stream of events
  // into new (reduced) values
  var reducers = Rx.Observable.merge(
    // AverageRange(getSensor(events, 'CpuTemperature'), 'CpuTemperature', 30, 65, (sValue) => sValue),
    // AverageRange(getSensor(events, 'CpuLoad'), 'CpuLoad', 0, 2, (sValue) => sValue[0]),
    // AverageRange(gpsEvents, 'Speed', 0, 45, (sValue) =>
    //   sValue.speed || 0),
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

  // snapshot every 1 second
  var oneSecSnapshot = Rx.Observable.timer(0, 1000)
    .map(() => _.pick(state, averageSensorNames))
    .map((snapshotUnnormalized) =>
      _.mapValues(snapshotUnnormalized, (value, sensor) => averageSensorReaders[sensor][2](value)))
    .map((snapshot) => _.assign({}, defaultValues, snapshot));


  // oneSecSnapshot.subscribe(console.log);
  var averages = Rx.Observable.merge(
    // TODO: extract times
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 1),
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 3),
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 5),
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 8),
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 13),
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 21),
    AverageFromSnapshot(oneSecSnapshot, averageSensorNames, 34));

  // combine single reduced values and state
  return Rx.Observable.merge(
    reducers,
    stateStream,
    averages).share();
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

function AverageFromSnapshot(snapshot, sensorNames, bufferCount) {

  return snapshot
    .bufferCount(bufferCount)
    .map(buf => _.reduce(buf, (avgSnapshot, item, ix, buf) =>
      _.mapValues(item, (value, name) =>
        avgSnapshot[name] + value / buf.length),
      defaultValues))
    // .map(avg => [avg, columnPixelWidth, calculateWidth(columnPixelWidth, avg, min, max)])
    // .do(console.log)
    .map((s) => ({
      name: ['Average', bufferCount].join('_'),
      value: s
    }));
    
}

function AverageRange(events, sensorName, min, max, valueSelector) {
  var averages = Rx.Observable.merge(
    Average(events, sensorName, min, max, valueSelector, 1),
    Average(events, sensorName, min, max, valueSelector, 3),
    Average(events, sensorName, min, max, valueSelector, 5),
    Average(events, sensorName, min, max, valueSelector, 8),
    Average(events, sensorName, min, max, valueSelector, 13),
    Average(events, sensorName, min, max, valueSelector, 21),
    Average(events, sensorName, min, max, valueSelector, 34));

  var averagesGraphs = averages.scan((graphs, avgColumn) => {

    var eventId = avgColumn.value.id;
    var averageDescription = avgColumn.name;
    var averagePixelInfo = avgColumn.value.dataColumn.slice(1);

    var graph = graphs[averageDescription];
    if (!graph) {
      graph = empty(rowHeight, columnPixelWidth);
    }

    // keep to 164! (rowHeight)
    graph = _.takeRight(graph, rowHeight - 1);
    graph.push(averagePixelInfo)

    graphs[averageDescription] = graph;

    return graphs;

  }, {}).map(value => ({
    name: 'AverageGraphs',
    value: value
  }));

  return Rx.Observable.merge(averages, averagesGraphs);
}

var rowHeight = 160;
var columnPixelWidth = 10;

function Average(events, sensorName, min, max, valueSelector, bufferCount) {
  return events
    .map(valueSelector)
    .bufferCount(bufferCount)
    .map(buf => _.reduce(buf, average, 0))
    .map(avg => [avg, columnPixelWidth, calculateWidth(columnPixelWidth, avg, min, max)])
    // .do(console.log)
    // .scan((acc, row) => {
    //   acc = _.takeRight(acc, rowHeight - 1);
    //   acc.push(row);
    //   return acc;
    // }, [])
    .map((dataColumn, ix) =>
      ({
        name: ['Average', bufferCount, sensorName].join('_'),
        value: {
          id: ix,
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

function calculateWidth(columnPixelWidth, val, min, max) {
  return Math.round(
    (columnPixelWidth / (max - min)) * (val - min));
}

function empty(rowHeight, columnPixelWidth) {
  return _
    .range(0, rowHeight)
    .map(() => [columnPixelWidth, 0]);
}