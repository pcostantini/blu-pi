var i2c = require("i2c-bus");
var Lsm303Driver = require("lsm303-rx").Lsm303Driver;
var take = require("rxjs/operators").take;

var options = {
    // looking at the source code, the synchronous and
    // asynchronous open functions are identical
    i2c: i2c.openSync(1)
};

lsm303 = new Lsm303Driver(options);

console.log('Reading 10 headings...');
var o = lsm303.streamHeadings(500) // sample every 500 ms
    .pipe(take(50))
    .subscribe(
        function (heading) {
            console.log('Next: ' + heading);
        },
        function (err) {
            console.log('Error: ' + err);
        },
        function () {
            console.log('Completed');
        }
    );