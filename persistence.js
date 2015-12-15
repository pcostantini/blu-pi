var _ = require('lodash');

function OpenDb(dbFile) {

  "use strict";
  var sqlite3 = require('sqlite3').verbose();
  var Schema = "CREATE TABLE IF NOT EXISTS sensors (timestamp INTEGER, info TEXT)"

  function insert(sensorsData) {

    var time = get(sensorsData, 'Clock').getTime();
    var json = JSON.stringify(sensorsData);

    // console.log('insert', sensorsData);
    db.run(
      "INSERT INTO sensors VALUES (?, ?)",
      [time, json]);
  }

  var db = new sqlite3.Database(dbFile, function () {
    db.run(Schema);
  });

  // cleanup
  process.on('exit', function() {
    console.log('CLEANUP:SQLITE');
    if(db) {
      db.close();
    }
  });

  return {
    insert: insert
  };

}

module.exports = {
  OpenDb: OpenDb
};

// helpers
function get(state, key) {
  return _.find(state, function(o) { return o.name === key; }).value;
}