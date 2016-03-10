var Persistence = require('../persistence');
var Rx = require('rx');
var _ = require('lodash');

var start = new Date();

function ReplayFromDb(dbFilePath) {

  // var baseTime = new Date();
  var source = new Rx.Subject();

  var db = Persistence(dbFilePath, true);
  db.readSensors()
    .then(startWithGps)
    .then(adaptEvents)
    .then(schedule(source));


  return source;
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
        () => source.onNext(_.pick(t, ['sensor', 'data'])));
    });
  }
}

function adaptEvents(events) {
  if(events.length === 0) return [];
  var first = events[0];
  var offset = first.timestamp;

  console.log('REPLAY OFFSET', offset)

  return events.map(adaptEvent(offset));
}

function adaptEvent(offset) {
  return function(event) {
    return {
      offset: event.timestamp - offset,
      sensor: event.sensor,
      data: JSON.parse(event.data)
    };
  };
}

module.exports = ReplayFromDb;