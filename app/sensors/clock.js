var Rx = require('rxjs');
var SensorName = 'Clock';

module.exports = function Clock() {
    return Rx.Observable.create((observer) =>
        setInterval(
            () => observer.next({
                name: SensorName,
                value: Date.now()
            }),
            1000)
    ).share();
};