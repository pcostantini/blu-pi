var SensorsDb = require('../persistence');

var fs = require('fs');
var _ = require('lodash');
var Kefir = require('kefir');

var dataDir = '../data/';
var mainDataFile = 'main.sqlite3';

// Main Db where all sensor data is merged
var mainDb = initMainDb();
function initMainDb() {
    var path = dataDir + mainDataFile;
    return new SensorsDb(path);
}

// read from existing dbs
var sessions =
    Kefir.merge(
        fs.readdirSync(dataDir)
        .filter(function(s) { return _.last(s.split('.')) == 'sqlite3' })
        .filter(function(s) { return s !== mainDataFile; })
        .map(readFromDb)
        .map(Kefir.fromPromise))
    .filter(notEmpty)
    .onValue(mainDb.insertSession);  // append to DB


function readFromDb(dbFile) {
    var db = new SensorsDb(dataDir + dbFile, true);
    return db.readSensors();
}

function notEmpty(rowSet) {
    return rowSet && rowSet.length > 0;
}
