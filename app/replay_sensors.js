var Persistence = require('../persistence');
var Rx = require('rxjs');
var _ = require('lodash');

function ReplayFromDb(queryPromise, scheduled) {
  var events = queryPromise
    .then(startWithGps)
    .then((events) => events.filter(
      (s) => s.name !== 'CpuLoad' &&
             s.name !== 'Clock' &&
             s.data !== 'null'))
    .then(mapWithOffset);

  var stream = new Rx.Subject();

  if(scheduled) {
    // schedule and emit
    events.then(schedule(stream));
  } else {
    // no schedule, run everything now
    events.then((events) => {
      events.forEach((e) => 
        stream.next(_.pick(e, ['name', 'value'])));
    });
  }

  return stream;
}

function startWithGps(events) {
  var firstGps = _.findIndex(events, e => e.sensor === 'Gps' && e.data !== 'null');
  if(firstGps == -1) return [];

  return events.slice(firstGps+1);
}

function mapWithOffset(events) {
  try {
    function withOffset(offset) {
      return function(event) {
        return {
          offset: event.timestamp - offset,
          name: event.sensor,
          value: JSON.parse(event.data)
        };
      };
    }

    if(events.length === 0) return [];
    var offset = events[0].timestamp;

    return events.map(withOffset(offset));
  } catch(err) {
    console.log('mapping err!', err);
  }
}

function schedule(source) {
  return function(events) {
    console.log('ReplaceSensors:scheduling events:', events.length);
    events.forEach((t) => {
      Rx.Scheduler.async.schedule(
        () => source.next(_.pick(t, ['name', 'value'])),
        t.offset,
        t);
    });
  }
}

module.exports = ReplayFromDb;
