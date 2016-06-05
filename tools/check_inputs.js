var inputs = require('../app/inputs');
var shake = require('../app/sensors/shake');

inputs()
    .merge(shake())
    .subscribe(console.log);

console.log('listening!...')