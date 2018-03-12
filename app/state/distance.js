var GpsDistance = require('gps-distance');
var GpsNoiseFilter = require('./gps_noise_filter');

// DISTANCE
// takes a gps stream, applies a noise filter
// returns a 'Distance' stream
module.exports = function DistanceReducer(gpsEvents) {

  var distance = 0;

  return gpsEvents
    .filter(
      GpsNoiseFilter(
        GpsNoiseFilter.DefaultSpeedThreshold))
    .map(gps => [gps.latitude, gps.longitude])
    .scan((last, curr) => {
      if (last) {
        // console.log('!!!!!!!!!!!', { last, curr })
        var offset = getNewOffset(last, curr);
        distance += offset;
      }
      return curr;
    }, null)
    .map(() => ({ name: 'Distance', value: distance }));
};

function getNewOffset(last, curr) {
  try {
    return GpsDistance(last[0], last[1], curr[0], curr[1]);
  } catch(err) {
    return 0;
  }
}