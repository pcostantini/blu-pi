var sqlite3 = require('sqlite3').verbose();
var _ = require('lodash');

module.exports = function(dbFile, readOnly) {

  var SqlSchemas = require('./schema');
  var SqlInsertSensor = 'INSERT INTO sensorEvents VALUES (?, ?, ?, ?)';
  var SqlInsertSession = 'INSERT INTO sessions (startTimestamp, endTimestamp, name) VALUES (?, ?, ?)';
  var SqlSelectSensor = 'SELECT timestamp, sensor, data FROM sensorEvents ORDER BY timestamp ASC';

  // create db conn
  var options = readOnly ? sqlite3.OPEN_READONLY : sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
  var db = new sqlite3.Database(dbFile, options, !readOnly ? tryCreateSchemas : null);

  const dispose = () => db.close();

  function tryCreateSchemas() {
    _.each(SqlSchemas, function(script) {
      db.run(script);
    });
  }

  function readSensors() {
    return new Promise(function(res, rej) {
      db.all(SqlSelectSensor, function(err, rows) {
        if(err) {
          return rej(err);
        }

        res(rows);
      });
    });
  }

	function insertSession(rowSet, sessionName) {

    return new Promise(function(res, rej) {

      if(readOnly) {
        rej('Db is in ReadOnly mode');
      }

      // timeframe
      var first = _.first(rowSet);
      var last = _.last(rowSet);

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
              dbStatement.run(sessionId, row.timestamp, row.sensor, row.data);
            });
            db.exec("COMMIT");

            res({ newSession: true, name: sessionName, rowSetLength: rowSet.length });
        });
      });

    });
  }

  return {

    readSensors: readSensors,
    
    insertSession: insertSession,

    dispose: dispose
  };

}