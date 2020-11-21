console.log('.')
var inputs = require('../app/inputs_push');
console.log('.')

inputs()
    .subscribe(console.log);

console.log('listening!...')
