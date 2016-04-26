var Persistence = require('../persistence');
var Rx = require('rxjs');
var _ = require('lodash');

module.exports = ReplayFromDb;

function ReplayFromDb(dbFilePath) {

  // mock clock using current time
  var clock = Rx.Observable.interval(1000)
    .map(() => ({ name: 'Clock', value: Date.now() }));

  // read events
  var db = Persistence(dbFilePath, true);
  var events = db
    .readSensors()
    .then(startWithGps)
    .then(mapWithOffset)
    // filter out cpu!
    .then((events) => events.filter((s) => s.name !== 'CpuLoad'));

  // CURRENT CPU!
  var cpu = require('./sensors/cpu_load')();

  // schedule and emit
  // ...?
  var source = Rx.Observable.create(function (observer) {
    events.then(schedule(observer));
  });

  return Rx.Observable
    .merge(clock, cpu, source)
    .share();
}

function schedule(source) {
  return function(events) {
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
}