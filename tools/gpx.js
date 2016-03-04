var xml2json = require('xml2json');
var _ = require('lodash');

function gpx(sensorEvents) {
  var items = getTrackEvents(sensorEvents)
  var json = asGpxObject(items);
  return xml2json.toXml(json);
}

function getTrackEvents(sensorEvents) {
  var events = sensorEvents.map(s => ({
    timestamp: s.timestamp,
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
const asPoint = (s) => ({
  ts: s.timestamp,
  lat: s.data.latitude,
  lon: s.data.longitude,
  el: s.data.altitude
});

const isTemp = (s) => s.sensor === 'Barometer' && !!s.data;
const asTemp = (s) => ({
  ts: s.timestamp,
  temp: s.data.temperature,
  pres: s.data.pressure
});

function asGpxObject(items) {

  var trackPoints = _.reduce(
    items,
    (ac, item) => {

      if(item.lat !== undefined) {
        ac.points.push(
          _.extend({ temp: ac.lastTemperature}, item));
      }

      if(item.temp !== undefined) {
        ac.lastTemperature = item.temp;
      }

      return ac;
    },
    { points: [], lastTemperature: null }
  ).points;

  var gpx = {
    gpx: {
      creator:        'blu-pi v0.1',
      version:        '1.1',
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
          '$t': 'Test Ride'
        },
        trkseg: trackPoints.map(toTrkpt)
      }
    }
  };

  return gpx;
}

const toIso = (ts) => new Date(ts).toISOString();

const toTrkpt = (e) => _.extend(
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
      toExtensions(e))
  });

const toExtensions = (e) => {
  var extensions = [];

  // Temperature
  if(_.isNumber(e.temp)) {
    extensions.push([ 'gpxtpx:atemp', { '$t': e.temp } ]);
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

module.exports = gpx;