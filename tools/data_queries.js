var Persistence = require('../app/persistence');
var Promise = require('bluebird');

var data = new Persistence('./data/sensors-1456895867978-TestRideParqueSarmiento.sqlite3', true);
var gps = data.readSensors('Gps').then((data) => data.length);
var ranges = data.getRanges();

Promise.all([gps, ranges])
    .then(console.log)
    .catch(console.error);