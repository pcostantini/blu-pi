const _ = require('lodash')
const Rx = require('rxjs');
const Promise = require('bluebird');
const sqlite3 = require('sqlite3').verbose();

'use strict';

const SqlCreateSchemas = [
    'CREATE TABLE IF NOT EXISTS SensorEvents (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, sensor constCHAR(64), data TEXT)'];
const SqlInsert =
    'INSERT INTO SensorEvents (timestamp, sensor, data) VALUES (?, ?, ?)';
const SqlGetAll =
    'SELECT timestamp, sensor, data FROM sensorEvents'; // ORDER BY timestamp ASC';  //  ORDER BY id ASC';
const SqlGetSensor =
    'SELECT timestamp, sensor, data FROM sensorEvents WHERE sensor = ?'; // ORDER BY timestamp ASC';  //  ORDER BY id ASC';
const SqlGetRanges =
    'SELECT * FROM ' +
    '(SELECT timestamp AS first FROM sensorEvents ORDER BY timestamp ASC LIMIT 1), ' +
    '(SELECT timestamp AS last FROM sensorEvents ORDER BY timestamp DESC LIMIT 1)';

function Persistence(dbFile, readOnly) {

    this.readOnly = readOnly;

    this.precompiledStatements = {};

    var self = this;
    this.dbPromise = new Promise((resolve, reject) => {

        // when db is ready
        const done = (err) => {
            if (err) {
                console.log('Persistence.Err!', err);
                return;
            }

            // precompile statements
            self.precompiledStatements.insertStatement = self.db.prepare(SqlInsert);

            console.log('Persistence.dbCreated');
            resolve(self.db);
        };

        var options = readOnly ? sqlite3.OPEN_READONLY : sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
        var onReady = !readOnly
            ? () => tryCreateSchemas(self.db, done)
            : () => done();

        self.db = new sqlite3.Database(dbFile, options, onReady);
    });
}

Persistence.prototype.dispose = function () {
    if (this.db) {
        db.close();
    }
}

Persistence.prototype.insert = function (message) {
    if (this.readOnly) {
        throw new Error('Db in ReadOnly mode');
    }

    var precompiledStatements = this.precompiledStatements;
    this.dbPromise.then(db => {
        var data = [
            message.timestamp,
            message.name,
            JSON.stringify(message.value)];
            
        precompiledStatements.insertStatement.run(data);
    });
}

Persistence.prototype.getRanges = function () {
    return runQuery(this.dbPromise, SqlGetRanges)
};

Persistence.prototype.readSensors = function (sensorName) {
    console.log('Persistence.readSensors:', sensorName || '*');
    var parameters = {};
    var query = SqlGetAll;
    var query = !sensorName ? SqlGetAll : SqlGetSensor
    if (sensorName) {
        query = SqlGetSensor;
        parameters['1'] = sensorName;
    }
    return runQuery(this.dbPromise, query, parameters)
};

module.exports = Persistence;

// Helpers
function runQuery(dbPromise, query, parameters) {
    return dbPromise.then(db => {
        var dbAll = Promise.promisify(db.all, { context: db });
        return dbAll(query, parameters);
    });
};

function tryCreateSchemas(db, done) {
    var i = 0;
    _.each(SqlCreateSchemas, script => {
        db.run(script, () => {
            i++;
            if (i == SqlCreateSchemas.length) done();
        });
    });
}