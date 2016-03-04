var Persistence = require('../persistence');
var asGpx = require('./gpx');

var dbPath = process.argv[2];

var db = Persistence(dbPath, true);
var track = db.readSensors()
  .then(asGpx)
  .then(console.log);