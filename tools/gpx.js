var xml2json = require('xml2json');
var _ = require('lodash');

const CreatorName = 'blu-pi';
const CreatorVersion = '0.2';

function read(sensorEvents, activityName) {
  var items = asTrackEvents(sensorEvents)
  var json = asGpxObject(items, activityName);
  return xml2json.toXml(json);
}

function readWithActivityName(activityName) {
  return function(sensorEvents) {
    return read(sensorEvents, activityName);
  }
}

module.exports = {
  read: read,
  readWithActivityName: readWithActivityName,
  asGpxObject: asGpxObject
};

function asTrackEvents(sensorEvents) {
  var events = sensorEvents.map(s => ({
    ts: s.timestamp || 0,
    sensor: s.sensor,
    data: JSON.parse(s.data)
  }));

  var track = events.filter(isGps)
                    .map(asPoint);
  var temp = events.filter(isTemp)
                   .map(asTemp);

  // TODO: obtain temp values within track points only
  var trackTemp = temp.filter(s => s.ts >= track[0].ts);
  var all = track.concat(trackTemp);
  var sorted = all.sort((a,b) => a.ts - b.ts);

  return sorted;
}

const isGps = (s) => s.sensor === 'Gps' && !!s.data;
const isTemp = (s) => s.sensor === 'Barometer' && !!s.data;
// const isCadence

const asPoint = (s) => ({
  ts: s.data.timestamp,
  lat: s.data.latitude,
  lon: s.data.longitude,
  el: s.data.altitude
});

const asTemp = (s) => ({
  ts: s.data.timestamp,
  temp: s.data.temperature,
  pres: s.data.pressure
});

// const asCadence

function asGpxObject(trackPoints, activityName) {
  var gpx = {
    gpx: {
      creator:        CreatorName,
      version:        CreatorVersion,
      xmlns:          'http://www.topografix.com/GPX/1/1',
      'xmlns:gpxx':   'http://www.garmin.com/xmlschemas/GpxExtensions/v3',
      'xmlns:gpxtpx': 'http://www.garmin.com/xmlschemas/TrackPointExtension/v1',
      metadata: {
        time: {
          '$t': toIso(trackPoints[0].ts)
        }
      },
      trk: {
        name: {
          '$t': activityName
        },
        trkseg: trackPoints.map(toTrkSegment)
      }
    }
  };

  return gpx;
}

const toIso = (ts) => new Date(ts).toISOString();

const toTrkSegment = (e) => _.extend(
  {
    trkpt: _.extend(
      {
        lat: e.lat,
        lon: e.lon,
        ele: {
          '$t': e.el
        },
        time: {
          '$t': toIso(e.ts)
        }
      },
      asExtensions(e))
  });

const asExtensions = (e) => {
  var extensions = [];

  // Temperature
  if(_.isNumber(e.temp)) {
    extensions.push([ 'gpxtpx:atemp', { '$t': e.temp } ]);
  }

  if(_.isNumber(e.cadence)) {
    extensions.push([ 'gpxtpx:cad', { }])
  }

  if(!extensions.length) return null;

  // Cadence...

  // Odomoter/speed...

  return {
    'extensions': {
      'gpxtpx:TrackPointExtension': _.fromPairs(extensions)
    }
  };
};