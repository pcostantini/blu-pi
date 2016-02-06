var _ = require('underscore');
var exitHook = require('exit-hook');
var Rx = require('rx');
var sqlite3 = require('sqlite3').verbose();

var bufferTimeout = 10 * 1000;

function OpenDb(dbFile, bufferSize) {

  "use strict";

  var SqlSchema = 'CREATE TABLE IF NOT EXISTS SensorEvents (timestamp INTEGER, sensor VARCHAR(64), data TEXT)';
  var SqlInsertMessage = 'INSERT INTO SensorEvents VALUES (?, ?, ?)';

  // create db
  var db = new sqlite3.Database(dbFile, function () {
    db.run(SqlSchema);
  });

  // buffered inserts
  var insertStream = new Rx.Subject();
  var transactionStream = insertStream.bufferWithTimeOrCount(bufferTimeout, bufferSize);
  
  // on buffer fill
  transactionStream.subscribe(function(bulk) {
    if(!db || !bulk) return; // db close or bulk empty
    
    console.log('saving %s records', bulk.length);

    db.serialize(function() {
        db.exec("BEGIN");
        var dbStatement = db.prepare(SqlInsertMessage);
        _.each(bulk, function(parameters) {
          dbStatement.run(parameters);
        });
        db.exec("COMMIT");
    });

  });

  // flush and cleanup on exit
  exitHook(function () {
    console.log('CLEANUP:SQLITE');

    // flush remaining records from bufer
    insertStream.onCompleted();
  
    // close db on exit, then exit!
    transactionStream.subscribeOnCompleted(function() {
      db.close();
      db = null;
      console.log('CLEANUP:SQLITE.CLOSED!')
    });

  });

  return {
    insert: function (message) {
      // TODO: insert properly. dump sensor event as json, normalize name
      var ts = message.timestamp;
      var sensor = message.name;
      var data = JSON.stringify(message.value);
      insertStream.onNext([ts, sensor, data]);
    }
  };

}

module.exports = {
  OpenDb: OpenDb
};