var Rx = require('rxjs');
var _ = require('lodash');

module.exports = function ReplayWithSchedule(sensors) {

    return Rx.Observable.create((observer) => {
        var offset = 0;
        sensors
            .first()
            .subscribe(o => {
                offset = o.timestamp;
                console.log('scheduling with offset:', offset);
            });

        sensors
            // .map(o => _.assign({ offset: o.timestamp - offset }, o))
            .subscribe(o => {
                if(!offset) {
                    console.log('skipping...?');
                }


                var newDelay = o.timestamp - offset;
                Rx.Scheduler.async.schedule(() => {
                    var delayedO = _.assign({}, o, { timestamp: new Date().getTime() });
                    observer.next(delayedO);
                }, newDelay);
            });

    }).share();
}