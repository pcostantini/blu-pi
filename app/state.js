module.change_mode = 1;

var Rx = require('rxjs');

module.exports.FromStream = function FromStream(events) {
  
  var gpsEvents = events
    .filter(s => s.name === 'Gps')
    .map(s => s.value);

  var distance = DistanceReducer(gpsEvents);
  var path = PathReducer(gpsEvents);

  var all = Rx.Observable.merge(events, distance, path);

  var state = {};
  var stateStream = all
    .scan((state, e) => {
      state[e.name] = e.value;
      return state;
    }, state)
    .map((state) => ({ 'name': 'State', 'value': state }));

  return stateStream;

  // redux ?
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

function PathReducer (gpsEvents) {
  return gpsEvents
    .map(gps => [gps.latitude, gps.longitude])
    .scan((path, point) => {
      path.push(point);
      return path;
    }, [])
    .map((path) => ({ name: 'Path', value: { length: path.length, points: path }}));
}