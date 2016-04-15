var GpsDistance = require('gps-distance');
var Persistence = require('../persistence');
var Rx = require('rx');
var _ = require('lodash');

var dbFilePath = process.argv[2];
if(!dbFilePath) throw new Error('no path to .sqlite!');

// load path
var db = Persistence(dbFilePath, true);
var gpsDone = db
  .readSensors()
  .then(evts => evts.filter(isGps)
                    .map(asTrackEvent)
                    .filter(e => !!e.data));

// whole path
gpsDone.then(evts => evts.map(getCoordinate))
       .then(path => console.log('path.distance', GpsDistance(path)));

// filtered path
var GpsNoiseFilter = require('../app/gps_noise_filter')(4);
gpsDone.then(evts => evts.map(s => s.data).filter(gps => GpsNoiseFilter(gps)).map(o => ({ data: o })))
       .then(evts => evts.map(getCoordinate))
       .then(path => console.log('path.filtered.distance', GpsDistance(path)));

// filtered, reduced one by one
// var GpsNoiseFilter = require('./app/gps_noise_filter')(5);
// gpsDone.then(evts => evts.map(s => s.data).filter(GpsNoiseFilter).map(o => ({ data: o })))
//        .then(evts => evts.map(getCoordinate))
//        .then(path => _.reduce(path, (acc, curr) => {
//         if(acc.last) {
//           var last = acc.last
//           acc.distance += GpsDistance(last[0], last[1], curr[0], curr[1]);
//         }

//         acc.last = curr;

//         return acc;
//        }, { last: null, distance: 0 }))
//        .then(o => console.log('path.filtered-reduced.distance', o.distance));


// helpers
const isGps = (s) => s.sensor === 'Gps' && !!s.data;

const asTrackEvent = (s) => ({
    timestamp: s.timestamp,
    sensor: s.sensor,
    data: JSON.parse(s.data)
  });

const getCoordinate = (s) => ([s.data.latitude, s.data.longitude]);