var Rx = require('rxjs');
var isValidGpsEvent = require('./utils').isValidGpsEvent;

module.exports = function ReplayWithSchedule(sensors) {

    // // start from a valid GPS events
    sensors = sensors
        .filter(o => isValidGpsEvent(o));

    // // start from a valid odometer read
    // sensors = sensors.skipWhile(o => 
    //     o.name !== 'Cadence');

    return Rx.Observable.create((observer) => {
        var firstEvent = null;
        sensors
            .first()
            .subscribe(o => firstEvent = o);

        sensors
            .subscribe(o => {
                if (!firstEvent) {
                    return;
                }

                var delay = o.timestamp - firstEvent.timestamp;
                Rx.Scheduler.async.schedule(() => {
                    observer.next({
                        ...o,
                        sensor: o.name,
                        timestamp: new Date().getTime()
                    });
                }, delay);
            });

    }).share();
}