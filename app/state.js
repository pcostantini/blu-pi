module.change_mode = 1;

var Rx = require('rxjs');

module.exports.FromStream = function FromStream(events) {
  var gpsEvents = events
    .filter(s => s.name === 'Gps')
    .map(s => s.value)
    .share();
  
  // calculate and reduce main stream of events
  // into new (reduced) values
  var reducers = Rx.Observable.merge(
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

function DistanceReducer (gpsEvents) {
// take gps events and calculate distance
  var GpsDistance = require('gps-distance');
  var GpsNoiseFilter = require('./gps_noise_filter');

  var distance = 0;

  return gpsEvents
    .filter(GpsNoiseFilter(GpsNoiseFilter.DefaultSpeedThreshold))
    .map(gps => [gps.latitude, gps.longitude])
    .scan((last, curr) => {
      if(last) {
        var offset = GpsDistance(last[0], last[1],
                                 curr[0], curr[1]);
        distance += offset;
      }
      return curr;
    }, null)
    .map(() => ({ name: 'Distance', value: distance }));
}

var lastPoint = [0,0];
function PathReducer (gpsEvents) {
  return gpsEvents
    .map(gps => [gps.latitude, gps.longitude])
    .filter(point => lastPoint[0] !== point[0] ||
                     lastPoint[1] !== point[1])
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