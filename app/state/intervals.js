var Rx = require('rxjs');
var gpsDistance = require('gps-distance');
var utils = require('../utils');

var minDistance = 0.025;
const constants = {
    START_GPS_REQUEST: 'Intervals.GpsStartRequest',
    START_DIST_REQUEST: 'Intervals.DistanceLapRequest',
    CLEAR: 'Intervals.Clear'
};

// vars for gps anchor laps
var lastKnownGps = null;
var anchor = null;

// vars for distance laps
//var distances = [];
var anchorDistance = null;
var currentDistance = null;
var distance = 0;

// Start GPS
global.globalEvents
    .filter(t => t.name === constants.START_GPS_REQUEST)
    .subscribe(t => {
        console.log('Starting intervals @ ', lastKnownGps);
        if (!lastKnownGps) return;
        anchor = [lastKnownGps.latitude, lastKnownGps.longitude]
    });

// Start Distance
global.globalEvents
    .filter(t => t.name === constants.START_DIST_REQUEST)
    .subscribe((t) => {
        // distance = currentDistance - distanceStart.value;
        // distanceStart.value = currentDistance;
        // distanceStart.time = Date.now();

        // console.log(currentDistance);

        // var currentDistance = { value: t.}

        // keep only two last marked distances
        // distances.push(currentDistance);
        // if (distances.length === 3) {
        //     distances.shift();
        // }

        console.log('START_DIST_REQUEST!', [anchorDistance, currentDistance]);
        if (anchorDistance) {
            distance = currentDistance.value - anchorDistance.value;
            console.log('\t...new distance!', distance);
            lap = true;
        }

        anchorDistance = currentDistance;
    });

// Clear
global.globalEvents
    .filter(t => t.name === constants.CLEAR)
    .subscribe(() => {
        anchor = null;
        lastKnownGps = null;
        distanceStart = { value: 0 };
        anchorDistance = null;
        distance = 0;
        // distances = [];
        reset = true;
        console.log('Intervals.CLEAR!')
    });

// ?
var reset = false;
var lap = false;
function IntervalsFromDistance(events) {
    return events
        .filter(o => o.name === 'Distance')
        .map((d) => {
            if (anchorDistance) {
                var diff = currentDistance.value - anchorDistance.value;

                console.log('...', JSON.stringify({ 
                    diff: diff,
                    time: (currentDistance.time - anchorDistance.time) / 1000,
                }));
                if(lap || (distance && diff >= distance)) {
                    lap = false;
                    // console.log('diff', {
                    //     currentDistance,
                    //     anchorDistance,
                    //     diff, distance
                    // });
                    // ...
                    var o = {
                        name: 'Interval',
                        value: {
                            distance: distance,
                            totalDistance: d.value * 1000,
                            time: (currentDistance.time - anchorDistance.time) / 1000,
                            timestamp: currentDistance.time
                        }
                    };

                    // distanceStart.value = currentDistance;
                    // distanceStart.time = Date.now();
                    // distances.shift();
                    // distances.push(currentDistance);

                    anchorDistance = currentDistance;

                    // console.log('!', o);
                    return o;
                    // ...
                }
            }

            
            currentDistance = {
                value: d.value,
                time: Date.now()
            };

            // nothing detected
            return null;
        })
        .filter(o => !!o)
        .do(console.log)
        .share();
}

// Gps Lap Detector
function IntervalsFromGps(events) {
    return events
        .do(gps => lastKnownGps = gps)
        .filter(o => anchor != null)
        // distance to anchor point
        .map(gps => [
            gps,
            gpsDistance(anchor[0], anchor[1], gps.latitude, gps.longitude)
        ])
        // get distasnce between last gps - dist
        // what is closer? - desc
        // last gps - last
        // previous gps - prev
        // lap indicates the anchor was JUST passed
        .startWith({ desc: false, distance: Number.MAX_VALUE })
        .scan((acc, o) => {
            // compare distsances:
            var gps = o[0];
            var dist = o[1];
            var nowDesc = dist < acc.dist
            if (acc.desc && !nowDesc && dist < minDistance) {
                acc.lapDetected = true
            } else {
                acc.lapDetected = false;
            }

            // TODO: 

            acc.prev = acc.last;
            acc.last = gps;
            acc.desc = nowDesc;
            acc.dist = dist;

            return acc;
        })
        // filter laps only
        .filter(s => s.lapDetected)
        // accumulate to get lap time
        .map(s => s.prev.timestamp)
        .startWith([])
        .scan((acc, ts) => {
            if (acc.length === 2) {
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
}

module.exports = function (events) {
    var intervalStream = Rx.Observable.merge(
        IntervalsFromGps(events),
        IntervalsFromDistance(events))

    var clearIntervals = global.globalEvents
        .filter(t => t.name === constants.CLEAR)
        .delay(333)
        .map(() => ({
            name: 'Intervals',
            value: []
        }));

    return Rx.Observable.merge(
        intervalStream,
        clearIntervals,
        intervalStream
            .startWith([])
            .scan((acc, o) => {
                if (reset) {
                    acc = [];
                    reset = false;
                };
                acc = acc.concat(o.value);
                return acc;
            })
            .map(o => ({
                name: 'Intervals',
                value: o
            }))
    ).share();

}

module.exports.constants = constants;