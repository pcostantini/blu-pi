var _ = require('underscore');
var exitHook = require('exit-hook');
var Rx = require('rx');
var sqlite3 = require('sqlite3').verbose();

var bufferTimeout = 10 * 1000;

function OpenDb(dbFile, bufferSize) {

  "use strict";

  var SqlSchema = 'CREATE TABLE IF NOT EXISTS SensorEvents (timestamp INTEGER, sensor VARCHAR(64), data TEXT)';
  var SqlInsertMessage = 'INSERT INTO SensorEvents VALUES (?, ?, ?)';

  // buffered inserts
  var inserts = new Rx.Subject();
  var bufferedInserts = inserts.bufferWithTimeOrCount(bufferTimeout, bufferSize);

  var db = null;
  // create db
  var dbCreated = new Promise(function(resolve, reject) {
    var db = new sqlite3.Database(dbFile, function () {
      // create initial schema
      db.run(SqlSchema, function() {
        resolve(db);
      });
    });
  });

  // flush and cleanup on exit
  dbCreated.then(db => {
    exitHook(function () {
      console.log('CLEANUP:SQLITE');
      // flush remaining records from bufer
      inserts.onCompleted();
      // close db on exit, then exit!
      bufferedInserts.subscribeOnCompleted(function() {
        db.close();
        console.log('CLEANUP:SQLITE.CLOSED!')
      });

    });
  });
  
  // on buffer fill
  bufferedInserts.subscribe(function(bulk) {
    if(!bulk || bulk.length === 0) return;
    
    if(db == null) {
      dbCreated.then((db) => serializeInserts(db, bulk));
    } else {
      serializeInserts(db, bulk);
    }

  });

  function serializeInserts(db, bulk) {
    console.log('saving %s records', bulk.length);
    var insertStatement = db.prepare(SqlInsertMessage);
    db.serialize(function() {
      db.exec("BEGIN");
      _.each(bulk, (params) => insertStatement.run(params ));
      db.exec("COMMIT");
    });
  }

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