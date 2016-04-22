var Rx = require('rxjs');

function CpuTemperature(delay) {
  if(!delay) delay = 5000;
  
  return Rx.Observable.create(function (observer) {

    var lastTemp;
    function read(temp) {
      try {
        temp.measure(function (value) {
          if(lastTemp === value)
          {
            return;
          }

          lastTemp = value;
          observer.next({ name: 'CpuTemperature', value: value });
        });
      } catch(err) {
        console.log('temp.err!', err);
      }

      setTimeout(() => read(temp), delay);
    }

    // init only on PI
    if(require('os').arch() === 'arm') {
      var temp = require('pi-temperature');
      read(temp);
    }

  });
}

module.exports = CpuTemperature;