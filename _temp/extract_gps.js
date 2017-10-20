var fs = require('fs');
var SensorsDb = require('../persistence');

var dbFile = '../sensors-1456895867978.sqlite3';
var outputFile = './test.gps.json';

// sensor=Gps
var newGpsEntries = readFromDb(dbFile)
    .then(data => {
    	return data
    		.filter(e => e.sensor === 'Gps' && e.data !== 'null')
        	.map(e => JSON.parse(e.data))
        	.map(e => e.point.splice(0,2));
        });

newGpsEntries.then(e => console.log(`new: ${e.length}`))

newGpsEntries.then(points => {
    var json = JSON.stringify(points);
    fs.writeFile(outputFile, json);
    console.log(`done! exported ${points.length} points.`);
});

function readFromDb(dbFile) {
    var db = new SensorsDb(dbFile, true);
    return db.readSensors();
}
