var Odometer = require('../app/sensors/odometer');


var instance = Odometer();
instance.subscribe(console.log);