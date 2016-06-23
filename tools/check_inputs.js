console.log('.')
var inputs = require('../app/inputs_gpio');
console.log('.')

inputs()
    .subscribe(console.log);

console.log('listening!...')
