var SensorsDb = require('./persistence');

var fs = require('fs');
var _ = require('lodash');
var Rx = require('rx');

var dataDir = './data/';
var mainDataFile = 'main.sqlite3';

// Main Db where all sensor data is merged
var mainDb = initMainDb();
function initMainDb() {
    var path = dataDir + mainDataFile;
    return new SensorsDb(path);
}

// read from existing dbs
var dbFetchs =
    Rx.Observable.merge(
        fs.readdirSync(dataDir)
        .filter(function(s) { return _.last(s.split('.')) == 'sqlite3' })
        .filter(function(s) { return s !== mainDataFile; })
        .map(readFromDb))
    .where(notEmpty)
    .select(mainDb.insertSession)            // append to main db
    // report
    .mergeAll()
    .do(console.log)
    .filter(function(res) { return res.newSession })
    .reduce(function(acc, current) { return acc + current; }, 0)
    .subscribe(function(t) { console.log('added total rows:', t); });


function readFromDb(dbFile) {
    var db = new SensorsDb(dataDir + dbFile, true);
    return db.readSensors();
}

function notEmpty(rowSet) {
    return rowSet && rowSet.length > 0;
}
