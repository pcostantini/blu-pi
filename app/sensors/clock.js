var Rx = require('rxjs');
var net = require('net');

var SensorName = 'Clock';

function GpsClock() {

  var opts = {
    port : 2947,
    hostname : 'localhost'
  };

  return Rx.Observable.create(function (observer) {

    var serviceSocket = new net.Socket();
    serviceSocket.setEncoding('ascii');
    serviceSocket.on("data", function (payload) {
      var info = payload.split('\n');
      for ( var index = 0; index < info.length; index++) {
        if (info[index]) {
          try {
            var data = JSON.parse(info[index]);
          } catch (error) {
            // self.emit('error', {
            //   message : "bad message format",
            //   cause : info[index],
            //   error : error
            // });
            continue;
          }
          
          if (data.class === 'TPV') {
            if(data.time) {

              var timestamp = 0;
              var dateTime = new Date(data.time);
              if (Object.prototype.toString.call(dateTime) === "[object Date]" && !isNaN(dateTime.getTime())) {
                timestamp = dateTime.getTime()
              } else {
                /* timestamp received is in seconds */
                // this one is technically old protocol
                timestamp = data.time * 1000
              }

              // self.emit('time', timestamp);
              // EMIT!

              observer.next({ name: SensorName, value: timestamp });
            }
          } else if (data.class === 'ERROR') {
            // self.emit('error', data);
          }
        }
      }
    });

    serviceSocket.on("close", function (err) {
      // self.emit('disconnect', err);
    });

    serviceSocket.on('connect', function (socket) {
      serviceSocket.write('?WATCH={"enable":true,"json":true}\n');
    });

    serviceSocket.on('error', function (error) {
      // if (error.code === 'ECONNREFUSED') {
      //   self.emit('error.connection');
      // } else {
      //   self.emit('error', error);
      // }
    });

    serviceSocket.connect(opts.port, opts.hostname);

  });

};

module.exports = GpsClock;