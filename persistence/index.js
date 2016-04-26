var _ = require('lodash');
var Rx = require('rxjs');
var sqlite3 = require('sqlite3').verbose();

function SessionPersistence(dbFile, readOnly) {

  "use strict";

  var SqlSchemas = ['CREATE TABLE IF NOT EXISTS SensorEvents (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, sensor VARCHAR(64), data TEXT)'];
  var SqlInsertMessage = 'INSERT INTO SensorEvents (timestamp, sensor, data) VALUES (?, ?, ?)';
  var SqlSelectSensors = 'SELECT timestamp, sensor, data FROM sensorEvents'; // ORDER BY timestamp ASC';  //  ORDER BY id ASC';

  // create db
  var db = null;
  var dbCreated = new Promise(function(resolve, reject) {

    var options = readOnly ? sqlite3.OPEN_READONLY : sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
    var newDb = new sqlite3.Database(dbFile, options, !readOnly ? tryCreateSchemas : done);

    var done = () => resolve(newDb);
    // function done() {
    //   resolve(newDb);
    // }

    function tryCreateSchemas() {
      var i=0;
      _.each(SqlSchemas, script => {
        newDb.run(script, () => {
          i++;
          if(i == SqlSchemas.length) done();
        });
      });
    }
  });

  dbCreated.then((newDb) => {
    db = newDb;
    insertStatement = db.prepare(SqlInsertMessage);
  });

  // inserts
  var insertStatement = null;
  var inserts = new Rx.Subject();
  inserts.subscribe(function(event) {
    if(db === null) return;
    insertStatement.run(event);
  });

  function insert(message) {
    if(readOnly) throw new Error('Db is in ReadOnly mode');

    var ts = message.timestamp;
    var sensor = message.name;
    var data = JSON.stringify(message.value);
    inserts.next([ts, sensor, data]);
  }

  // query
  function readSensors() {
    return new Promise(function(res, rej) {
      dbCreated.then(db => {
        db.all(SqlSelectSensors, function(err, rows) {
          if(err) return rej(err);
          res(rows);
        });
      });
    });
  }
  
  function dispose() {
    if(db) db.close();
  }

  return {
    insert: insert,
    readSensors: readSensors,
    dispose: dispose
  };

}

module.exports = SessionPersistence;