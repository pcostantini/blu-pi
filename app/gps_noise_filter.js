const DefaultSpeedThreshold = 5;

module.exports = function(threshold) {
	var last = null;
	return function GpsNoiseFilter(gps) {
	  var previous = last;
	  var current = gps;
	  last = current;

	  // if no previous record, pass
	  if(!previous) return true;

	  // if previous or current have speed, pass
	   if(previous.speed > threshold ||
	     current.speed > threshold) return true;

	  // if previous and current speed and below threshold
	  // ignore!
	  if(previous.speed < threshold &&
	     current.speed < threshold) {
	    console.log('noise gps!', { p: previous, c: current });
	    return false;
	  }

	  return true;

	  // return gps && gps.latitude;
	}
}

module.exports.DefaultSpeedThreshold = DefaultSpeedThreshold;
