var GpsDistance = require('gps-distance');
var GpsNoiseFilter = require('./gps_noise_filter');

// GPS
// takes a gps stream, applies a noise filter
// returns a 'Distance' stream
function GpsDistanceReducer(gpsEvents) {

  var distance = 0;

  return gpsEvents
    .filter(GpsNoiseFilter(GpsNoiseFilter.DefaultSpeedThreshold))
    .map(gps => [gps.latitude, gps.longitude])
    .scan((last, curr) => {
      if (last) {
        var offset = getNewOffset(last, curr);
        distance += offset;
      }
      return curr;
    }, null)
    .map(() => ({ name: 'DistanceGps', value: distance }));
};

function DistanceReducer(odometerEvents) {
  var distance = 0;
  return odometerEvents
    .filter(o => o.value.distance !== distance)
    .do(o => distance = o.value.distance)
    .map(o => ({ name: 'Distance', value: o.value.distance }))
    // .do(console.log);
}

function getNewOffset(last, curr) {
  try {
    return GpsDistance(last[0], last[1], curr[0], curr[1]);
  } catch(err) {
    return 0;
  }
}

module.exports = {
  GpsDistanceReducer: GpsDistanceReducer,
  DistanceReducer: DistanceReducer
}