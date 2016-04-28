var Persistence = require('../persistence');
var Rx = require('rxjs');
var _ = require('lodash');

module.exports = ReplayFromDb;

function ReplayFromDb(dbFilePath) {


  // read events
  var db = Persistence(dbFilePath, true);
  var events = db
    .readSensors()
    .then(startWithGps)
    .then(mapWithOffset)
    .then((events) => events.filter((s) => s.name !== 'CpuLoad'));

  // CURRENT CPU!

  // schedule and emit
  // ...?
  var stream = new Rx.Subject();
  events.then(schedule(stream));

  // unmock clock and cpu using current values
  var clock = Rx.Observable.interval(1000)
    .map(() => ({ name: 'Clock', value: Date.now() }));
  var cpu = require('./sensors/cpu_load')();

  return Rx.Observable
    .merge(clock, cpu, stream)
    .share();
}

function schedule(source) {
  return function(events) {
    console.log('scheduling events', events.length);
    events.forEach((t) => {
      Rx.Scheduler.async.schedule(
        () => source.next(_.pick(t, ['name', 'value'])),
        t.offset,
        t);
    });
  }
}

function startWithGps(events) {
  var firstGps = _.findIndex(events, e => e.sensor === 'Gps' && e.data !== 'null');
  if(firstGps == -1) return [];

  return events.slice(firstGps);
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