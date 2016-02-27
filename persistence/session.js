var _ = require('underscore');
var Rx = require('rx');
var sqlite3 = require('sqlite3').verbose();

var bufferTimeout = 10 * 1000;

function OpenDb(dbFile) {

  "use strict";

  var SqlSchema = 'CREATE TABLE IF NOT EXISTS SensorEvents (timestamp INTEGER, sensor VARCHAR(64), data TEXT)';
  var SqlInsertMessage = 'INSERT INTO SensorEvents VALUES (?, ?, ?)';
  var SqlSelectSensors = 'SELECT timestamp, sensor, data FROM sensorEvents ORDER BY timestamp ASC';

  // create db
  var db = null;
  var insertStatement = null;
  var dbCreated = new Promise(function(resolve, reject) {
    var newDb = new sqlite3.Database(dbFile, function () {
      // create initial schema
      newDb.run(SqlSchema, function() {
        resolve(newDb);
      });
    });
  });

  dbCreated.then((newDb) => {
    db = newDb;
    insertStatement = db.prepare(SqlInsertMessage);
  });

  // inserts
  var inserts = new Rx.Subject();
  inserts.subscribe(function(event) {
    if(db === null) return;
    insertStatement.run(event);
  });

  function insert(message) {
    var ts = message.timestamp;
    var sensor = message.name;
    var data = JSON.stringify(message.value);
    inserts.onNext([ts, sensor, data]);
  }

  function retrieveAll() {
    return new Promise(function(res, rej) {
      console.log(db)
      if(db === null) return res([]);
      db.all(SqlSelectSensors, function(err, rows) {
        console.log(arguments)
        if(err) return rej(err);
        res(rows);
      });
    });
  }

  return {
    insert: insert,
    retrieveAll: retrieveAll 
  };

}

module.exports = {
  OpenDb: OpenDb
};