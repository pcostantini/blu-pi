var Rx = require('rxjs');
// var _ = require('lodash');
const { isValidGpsEvent } = require('./utils');

module.exports = function ReplayWithSchedule(sensors) {

    // start from a valid GPS events
    // sensors = sensors
    //     .skipWhile(o => !isValidGpsEvent(o));

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
                    // var o = _.assign({}, o, { timestamp: new Date().getTime() });
                    observer.next({
                        ...o,
                        sensor: o.name,
                        timestamp: new Date().getTime()
                    });
                }, delay);
            });

    }).share();
}