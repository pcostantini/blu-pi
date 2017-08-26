var Rx = require('rxjs');
var _ = require('lodash');

module.exports = function ReplayWithSchedule(sensors) {

    return Rx.Observable.create((observer) => {
        console.log('scheduling...')

        var offset = 0;
        var found = false;

        sensors = sensors.skipWhile(o => {
            if(found) return false;

            found = o.name === 'Gps' && o.value && o.value.latitude;

            return true;
        })
        sensors.first().subscribe(o => offset = o.timestamp);
        sensors
            .map(o => _.assign({ offset: o.timestamp - offset }, o))
            .subscribe(
                o => Rx.Scheduler.async.schedule(() => {
                    var delayedO = _.assign({}, o, { timestamp: new Date().getTime() });
                    observer.next(delayedO);
                }, o.offset));

        // sensors.subscribe(console.log);
        // { name: 'MagnometerTemperature',
        // value: { temp: 40.25 },
        // timestamp: 1500589939382 }

    }).share();
}