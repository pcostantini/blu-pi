var Persistence = require('../app/persistence');
var Gpx = require('./gpx');

// input:
// [0] = .sqlite file
// [1] = activity name [optional]

var dbFilePath = process.argv[2];
if(!dbFilePath) throw new Error('no path to .sqlite!');
var activityName = process.argv[3];
if(!activityName) {
	activityName = parseInt(dbFilePath, 10);
}
if(!activityName) {
	activityName = dbFilePath.split('.')[0]; // remove .ext
}

var db = new Persistence(dbFilePath, true);

var track =
  db.readSensors()
    .then(Gpx.readWithActivityName(activityName))
    .then(console.log);