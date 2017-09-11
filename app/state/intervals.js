var Rx = require('rxjs');
var distance = require('gps-distance');
var utils = require('../utils');

var minDistance = 0.025;

var lastKnownGps = null;
var anchor = null;
// var anchor = [
//     -34.567803,
//     -58.508071
// ];

// HACK: Register for interval requests
global.globalEvents
    .filter(t => t.name === 'Interval.StartRequest')
    .subscribe(t => {
        console.log('Starting intervals @ ', lastKnownGps);
        if(!lastKnownGps) return;
        anchor = [lastKnownGps.latitude, lastKnownGps.longitude]
    });


function IntervalsFromGps(gpsStream) {
    var intervalStream = gpsStream
        .do(gps => lastKnownGps = gps)
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
                time: t,
                timestamp: Date.now()
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

module.exports = IntervalsFromGps;