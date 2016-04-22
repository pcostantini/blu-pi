var Persistence = require('../persistence');
var Rx = require('rxjs');
var _ = require('lodash');

var clock = Rx.Observable.timer(0, 1000)
  .map(() => ({ name: 'Clock', value: Date.now() }));


function ReplayFromDb(dbFilePath) {
  var source = new Rx.Subject();
  
  var db = Persistence(dbFilePath, true);
  db.readSensors()
    .then(startWithGps)
    .then(toEvents)
    .then(schedule(source));

  return Rx.Observable.merge(clock, source)
    .share();
}

function startWithGps(events) {
  var firstGps = _.findIndex(events, e => e.sensor === 'Gps' && e.data !== 'null');
  if(firstGps == -1) return [];
  return events.slice(firstGps);
}

function schedule(source) {
  return function(events) {
    events.forEach((t) => {
      Rx.Scheduler.async.schedule(
        (x) => source.next(_.pick(x, ['name', 'value'])),
        t.offset,
        t);
    });
  }
}

function toEvents(events) {
  if(events.length === 0) return [];
  var first = events[0];
  var offset = first.timestamp;

  console.log('REPLAY OFFSET', offset)

  return events.map(toEvent(offset));
}

function toEvent(offset) {
  return function(event) {
    return {
      offset: event.timestamp - offset,
      name: event.sensor,
      value: JSON.parse(event.data)
    };
  };
}

module.exports = ReplayFromDb;