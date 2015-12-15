function OpenDb() {

  "use strict";
  var sqlite3 = require('sqlite3').verbose();
  var Schema = "CREATE TABLE IF NOT EXISTS sensors (info TEXT)"

  function insert(sensorsData) {
    // console.log('insert', sensorsData);
  }

  var db = new sqlite3.Database('sensors.sqlite3', function () {
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