var Rx = require('rxjs');
var gpsDistance = require('gps-distance');

var MIN_DISTANCE = 0.025;
var CONSTANTS = {
    START_GPS_REQUEST: 'Intervals.GpsStartRequest',
    START_DIST_REQUEST: 'Intervals.DistanceLapRequest',
    CLEAR: 'Intervals.Clear'
};

var reset = false;
var lapStartEvents = new Rx.Subject();
var lapProgressEvents = new Rx.Subject();

// Start GPS
global.globalEvents
    .filter(t => t.name === CONSTANTS.START_GPS_REQUEST)
    .subscribe(() => {
        if (!lastKnownGps) {
            console.log('no gps events (yet)');
            return;
        }

        if (anchorGps) {
            console.log('already have GPS anchor, ignoring');
            return;
        }

        console.log('START_GPS_REQUEST @', lastKnownGps);
        anchorGps = [lastKnownGps.latitude, lastKnownGps.longitude]
        lapStartEvents.next({
            name: 'IntervalLapStart',
            value: {
                time: Date.now(),
                type: 'GPS'
            }
        });
    });

// Start Distance
global.globalEvents
    .filter(t => t.name === CONSTANTS.START_DIST_REQUEST)
    .subscribe(() => {
        if (distance !== 0) {
            console.log('already have Distance anchor, ignoring');
            return;
        }

        console.log('START_DIST_REQUEST @', [anchorDistance, currentDistance]);
        if (!anchorDistance) {
            // new lap start
            anchorDistance = currentDistance;
            lapStartEvents.next({
                name: 'IntervalLapStart',
                value: {
                    time: Date.now(),
                    type: 'Distance'
                }
            });
        } else {
            // mark lap end
            distance = currentDistance.value - anchorDistance.value;
            console.log('\t...new distance:', distance);
            lap = true;
        }
    });

// Clear
global.globalEvents
    .filter(t => t.name === CONSTANTS.CLEAR)
    .subscribe(() => {
        // gps
        anchorGps = null;
        lastKnownGps = null;
        intervalGpsAcc = { ...EMPTY_GPS_INTERVAL };
        intervalGpsPoints = [];

        // distance
        lap = false;
        anchorDistance = null;
        currentDistance = null;
        distance = 0;

        reset = true;
        console.log('Intervals.CLEAR!')
    });


// Distance Lap Detector
var lap = false;
var anchorDistance = null;
var currentDistance = null;
var distance = 0;
function IntervalsFromDistance(events) {
    var distanceSensorName = 'DistanceGps';
    events
        .filter(o => o.name === 'Distance')
        .first()
        .subscribe(o => distanceSensorName = 'Distance');

    return events
        .filter(o => o.name === distanceSensorName)
        .map((d) => {
            currentDistance = {
                value: d.value,
                time: Date.now()
            };

            if (anchorDistance) {
                var diff = currentDistance.value - anchorDistance.value;
                console.log('...', JSON.stringify({
                    diff: diff,
                    time: (currentDistance.time - anchorDistance.time),
                }));

                // trigger interval "in progress" distance event
                lapProgressEvents.next({
                    name: 'IntervalProgress',
                    value: {
                        distance: diff
                    }
                });

                if (lap || (distance && diff >= distance)) {
                    lap = false;
                    anchorDistance = currentDistance;
                    // ...
                    return {
                        name: 'Interval',
                        value: {
                            type: 'Distance',
                            distance: distance,
                            time: (currentDistance.time - anchorDistance.time),
                            timestamp: currentDistance.time
                        }
                    };

                }
            }

            // nothing detected
            return null;
        })
        .filter(o => !!o)
        .do(console.log)
        .share();
}

// Gps Lap Detector
var EMPTY_GPS_INTERVAL = { desc: false, dist: Number.MIN_VALUE }
var anchorGps = null;
var lastKnownGps = null;
var intervalGpsAcc = { ...EMPTY_GPS_INTERVAL };
var intervalGpsPoints = [];
function IntervalsFromGps(gpsEvents) {
    return gpsEvents
        .do(gps => lastKnownGps = gps)
        .filter(o => !!anchorGps)
        .do(o => intervalGpsPoints.push(o))
        // distance to anchor point
        .map(gps => [
            gps,
            gpsDistance(anchorGps[0], anchorGps[1], gps.latitude, gps.longitude)
        ])
        // remember point
        // get distasnce between last gps - dist
        // what is closer? - desc
        // last gps - last
        // previous gps - prev
        // lap indicates the anchor was JUST passed
        .map(o => {
            var gps = o[0];
            var dist = o[1];
            var nowDesc = dist < intervalGpsAcc.dist;
            var lap = intervalGpsAcc.desc && !nowDesc && dist < MIN_DISTANCE;

            intervalGpsAcc.prev = intervalGpsAcc.last;
            intervalGpsAcc.last = gps;
            intervalGpsAcc.desc = nowDesc;
            intervalGpsAcc.dist = dist;

            if (lap) {
                // lap detected
                console.log('detected lap:', {
                    lap: lap,
                    intervalGpsAcc: intervalGpsAcc,
                    distance: gpsDistance(
                        intervalGpsPoints.map(g => [g.latitude, g.longitude]))
                });
            }

            return {
                type: 'GPS',
                lap: lap,
                time: (gps.timestamp - intervalGpsPoints[0].timestamp),
                timestamp: gps.timestamp,
                distance: lap
                    ? gpsDistance(intervalGpsPoints.map(g => [g.latitude, g.longitude]))
                    : 0
            };
        })
        .filter(i => i.lap && i.distance > 0)
        .map(i => ({
            name: 'Interval',
            value: i
        }))
        .do(console.log)
        .do(() => intervalGpsPoints = []) // reset interval history
        .share();
}

module.exports = function (all, gpsEvents) {

    var clearStream = global.globalEvents
        .filter(t => t.name === CONSTANTS.CLEAR)
        .share();

    var intervalStream = Rx.Observable.merge(
        IntervalsFromGps(gpsEvents),
        IntervalsFromDistance(all)).share();

    intervalStream.subscribe((o) => lapStartEvents.next(({
        name: 'IntervalLapStart',
        value: {
            time: Date.now(),
            type: o.value.type
        }})));

    return Rx.Observable.merge(
        // reset events
        clearStream.map(() => ({
            name: 'Intervals',
            value: []
        })),
        clearStream.map(() => ({
            name: 'Interval',
            value: null
        })),
        clearStream.map(() => ({
            name: 'IntervalLapStart',
            value: null
        })),
        // lap start events
        lapStartEvents.share(),
        // lap progress events
        lapProgressEvents.share(),
        // detected intervals
        intervalStream,
        // accumulated intervals
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

module.exports.constants = CONSTANTS;