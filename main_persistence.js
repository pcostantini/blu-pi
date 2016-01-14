var sqlite3 = require('sqlite3').verbose();
var _ = require('lodash');

module.exports = function(dbFile, readOnly) {

  "use strict";

  var SqlSchemas = [
    'CREATE TABLE IF NOT EXISTS sensors (' +
      'sessionId INTEGER NOT NULL, ' + 
      'timestamp INTEGER NOT NULL, ' +
      'info TEXT NOT NULL);',

    'CREATE TABLE IF NOT EXISTS sessions (' +
      'sessionId INTEGER PRIMARY KEY AUTOINCREMENT, ' +
      'startTimestamp INTEGER UNIQUE NOT NULL, ' +
      'endTimestamp INTEGER NOT NULL, ' +
      'name TEXT);'];

  var SqlInsertSensor = 'INSERT INTO sensors VALUES (?, ?, ?)';
  var SqlInsertSession = 'INSERT INTO sessions (startTimestamp, endTimestamp, name) VALUES (?, ?, ?)';

  // create db conn
  var options = readOnly ? sqlite3.OPEN_READONLY : sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;

  var db = new sqlite3.Database(dbFile, options, !readOnly ? tryCreateSchemas : null);

  function tryCreateSchemas() {
    _.each(SqlSchemas, function(script) {
      db.run(script);
    });
  }

  return {

    readSensors: function () {
      return readSensorData(db);
    },
    
    insertSession: function(rowSet) {

      return new Promise(function(res, rej) {

        if(readOnly) {
          rej('Db is in ReadOnly mode');
        }

        // timeframe
        var first = _.first(rowSet);
        var last = _.last(rowSet);
        var sessionName = new Date(first.timestamp).toString();

        // add session
        var sessionCreated = new Promise(function(sessionResolve, sessionReject) {
          db.run(SqlInsertSession, [first.timestamp, last.timestamp, sessionName], function() {
            var sessionId = this.lastID;
            if(sessionId !== undefined) {
              sessionResolve(sessionId);
            } else {
              res({ newSession: false, name: sessionName });
            }
          });
        });

        // add rows
        sessionCreated.then(function(sessionId) {
          db.serialize(function() {
              db.exec("BEGIN");
              var dbStatement = db.prepare(SqlInsertSensor);
              _.each(rowSet, function(row) {
                dbStatement.run(sessionId, row.timestamp, row.info);
              });
              db.exec("COMMIT");

              res({ newSession: true, name: sessionName, rowSetLength: rowSet.length });
          });
        });

      });
    },

    dispose: function() {
      db.close();
    }
  };

}

function readSensorData(db) {
  return new Promise(function(res, rej) {
    db.all('SELECT timestamp, info FROM sensors', function(err, rows) {
      // ignore errors
      // if(err) {
      //   return rej(err);
      // }

      res(rows);
    });
  });
}
