var _ = require('underscore');
var Rx = require('rx');
var sqlite3 = require('sqlite3').verbose();

var bufferTimeout = 10 * 1000;

function OpenDb(dbFile, bufferSize) {

  "use strict";

  var SqlSchema = 'CREATE TABLE IF NOT EXISTS SensorEvents (timestamp INTEGER, sensor VARCHAR(64), data TEXT)';
  var SqlInsertMessage = 'INSERT INTO SensorEvents VALUES (?, ?, ?)';

  // create db
  var db = null;
  var insertStatement = null;
  var dbCreated = new Promise(function(resolve, reject) {
    var db = new sqlite3.Database(dbFile, function () {
      // create initial schema
      db.run(SqlSchema, function() {
        resolve(db);
      });
    });
  });

  dbCreated.then((dbInstance) => {
    db = dbInstance;
    insertStatement = db.prepare(SqlInsertMessage);
  });

  // inserts
  var inserts = new Rx.Subject();
  inserts.subscribe(function(event) {
    if(db === null) return;
    insertStatement.run(event);
  });

  return {
    insert: function (message) {
      // TODO: insert properly. dump sensor event as json, normalize name
      var ts = message.timestamp;
      var sensor = message.name;
      var data = JSON.stringify(message.value);
      inserts.onNext([ts, sensor, data]);
    }
  };

}

module.exports = {
  OpenDb: OpenDb
};