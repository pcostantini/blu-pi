var _ = require('lodash');
var Rx = require('rxjs');
var networkInterfaces = require('os').networkInterfaces;

var SensorName = 'IpAddress';
var RequeueDelay = 10 * 1000;

module.exports = function IpAddress() {
    return Rx.Observable.create(function (observer) {

        (function broadcastIp() {
            const nets = networkInterfaces();
            const results = {};

            for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                    if (net.family === 'IPv4' && !net.internal) {
                        results[name] = net.address;
                    }
                }
            }

            // console.log(results);
            observer.next({ name: SensorName, value: results });

            // requeue
            setTimeout(() => broadcastIp(), 1000);
        })();

    }).share();
}