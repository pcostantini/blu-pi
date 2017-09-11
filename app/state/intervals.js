var Rx = require('rxjs');
var distance = require('gps-distance');
var utils = require('../utils');

var minDistance = 0.025;

// var anchor = null;
var anchor = [
    -34.567803,
    -58.508071
];

function IntervalsFromGps(gpsStream) {
    var intervalStream = gpsStream
        .filter(o => anchor != null)
        // distance to anchor point
        .map(gps => [
            gps,
            distance(anchor[0], anchor[1], gps.latitude, gps.longitude)
        ])
        // get distasnce between last gps - dist
        // what is closer? - desc
        // last gps - last
        // previous gps - prev
        // lap indicates the anchor was JUST passed
        .startWith({ desc: false, distance: Number.MAX_VALUE })
        .scan((acc, o) => {
            var gps = o[0];
            var dist = o[1];
            var nowDesc = dist < acc.dist
            if(acc.desc && !nowDesc && dist < minDistance) {
                acc.lap = true
            } else {
                acc.lap = false;
            }

            acc.prev = acc.last;
            acc.last = gps;
            acc.desc = nowDesc;
            acc.dist = dist;

            return acc;
        })
        // filter laps only
        .filter(s => s.lap)
        // accumulate to get lap time
        .map(s => s.prev.timestamp)
        .startWith([])
        .scan((acc, ts) => {
            if(acc.length === 2) {
                return [acc[1], ts];
            }

            acc.push(ts);
            return acc;
        })
        .filter(acc => acc.length === 2)
        // done, map time
        .map(acc => acc[1] - acc[0])
        // .do(ts => console.log(toHHMMSS(ts)))
        .map(t => ({
            name: 'Interval',
            value: {
                anchor: anchor,
                time: t
            }
        }))
        .share();

    // return interval event + a summary of all intervals so far
    return Rx.Observable.merge(
        intervalStream,
        intervalStream
            .startWith([])
            .scan((acc, o) => acc.concat(o.value))
            .map(o => ({
              name: 'Intervals',
              value: o
            }))
    ).share();
}

function toHHMMSS(ticks) {
  var sec_num = ticks / 1000;
  var hours   = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (hours   < 10) {hours   = "0"+hours;}
  if (minutes < 10) {minutes = "0"+minutes;}
  if (seconds < 10) {seconds = "0"+seconds;}
  return hours+':'+minutes+':'+seconds;
}

module.exports = IntervalsFromGps;