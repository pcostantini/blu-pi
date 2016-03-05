var Persistence = require('../persistence');

var fs = require('fs');
var _ = require('lodash');
var O = require('kefir');

var dataDir = './data/';
var mainDataFile = 'main.sqlite3';

// Main Db where all sensor data is merged
var mainDb = initMainDb();
function initMainDb() {
  var path = dataDir + mainDataFile;
  return new Persistence(path);
}

// read from existing dbs
O.merge(
  fs.readdirSync(dataDir)
    .filter(function(s) { return _.last(s.split('.')) == 'sqlite3' })
    .filter(function(s) { return s !== mainDataFile; })
    .map(readDb)
    .map(O.fromPromise)
)
.filter(notEmpty)               // ignore empty rowsets
.onValue(function(rowSet) {
  mainDb.insertSession(rowSet,
    new Date(rowSet[0].timestamp).toString()) });  // append to DB


function readDb(dbFile) {
  var db = new Persistence(dataDir + dbFile, true);
  return db.readSensors();
}

function notEmpty(rowSet) {
  return rowSet && rowSet.length > 0;
}
