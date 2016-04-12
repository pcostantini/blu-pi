const DefaultSpeedThreshold = 4;

module.exports = function(threshold) {
  var last = null;
  return function GpsNoiseFilter(gps) {
    var previous = last;
    var current = gps;
    last = current;

    var previousSpeed = (previous ? previous.speed : 0) || 0;
    var currentSpeed = (current ? current.speed : 0) || 0;

    if(previousSpeed < threshold &&
       currentSpeed < threshold) {
      // console.log('noise gps!', {
      //   previous: previous,
      //   current: current
      // });
      return false;
    }


    return true;
  }
}

module.exports.DefaultSpeedThreshold = DefaultSpeedThreshold;
