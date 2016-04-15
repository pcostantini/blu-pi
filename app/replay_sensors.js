var Persistence = require('../persistence');
var Rx = require('rx');
var _ = require('lodash');

var start = new Date();

function ReplayFromDb(dbFilePath) {
  var source = new Rx.Subject();
  
  var db = Persistence(dbFilePath, true);
  db.readSensors()
    .then(startWithGps)
    .then(toEvents)
    .then(schedule(source));

  return source.share();
}

function startWithGps(events) {
  var firstGps = _.findIndex(events, e => e.sensor === 'Gps' && e.data !== 'null');
  if(firstGps == -1) return [];
  return events.slice(firstGps);
}

function schedule(source) {
  return function(events) {
    events.forEach((t) => {
      Rx.Scheduler.default.scheduleFuture(
        null,
        t.offset,
        () => source.onNext(_.pick(t, ['name', 'value'])));
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