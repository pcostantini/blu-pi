var _ = require('lodash');
var Rx = require('rx');
var sqlite3 = require('sqlite3').verbose();

var batchRecords = 50;
var batchTimeout = batchRecords * 1000 + 500;

function OpenDb(dbFile) {

  "use strict";

  var SqlSchema = 'CREATE TABLE IF NOT EXISTS sensors (timestamp INTEGER, info TEXT)';
  var SqlInsertSensors = 'INSERT INTO sensors VALUES (?, ?)';

  // create db
  var db = new sqlite3.Database(dbFile, function () {
    db.run(SqlSchema);
  });

  // buffered inserts
  var insertStream = new Rx.Subject();
  var transactionStream = insertStream.bufferWithTimeOrCount(batchTimeout, batchRecords);
  
  // on buffer complete
  transactionStream.subscribe(function(bulk) {
    if(!db || !bulk) return; // db close or bulk empty
    
    console.log('saving %s records', bulk.length);
    db.serialize(function() {
        db.exec("BEGIN");
        var dbStatement = db.prepare(SqlInsertSensors);
        _.each(bulk, function(parameters) {
          dbStatement.run(parameters);
        });
        db.exec("COMMIT");
    });
  });

  // flush and cleanup on exit
  process.on('SIGINT', function () {
    console.log('CLEANUP:SQLITE');

    // flush remaining records from bufer
    insertStream.onCompleted();
  
    // close db on exit, then exit!
    transactionStream.subscribeOnCompleted(function() {
      db.close();
      db = null;
      process.exit();
    });

  });

  return {
    insert: function (sensorsData) {
      // ts
      var time = sensorsData.Clock;

      // data?
      var json = JSON.stringify(sensorsData);

      // queue
      insertStream.onNext([time, json]);
    }
  };

}

module.exports = {
  OpenDb: OpenDb
};

// helpers
function get(state, key) {
  return _.find(state, function(o) { return o.name === key; }).value;
}