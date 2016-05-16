CreateGpsNoiseFilter.DefaultSpeedThreshold = 4;
function CreateGpsNoiseFilter(threshold) {
  threshold = threshold || CreateGpsNoiseFilter.DefaultSpeedThreshold;
  var last = null;
  return function(gps) {
    var previous = last;
    var current = gps;

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

    last = current;
    return true;
  }
}


module.exports = CreateGpsNoiseFilter;