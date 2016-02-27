var GPIO = require('onoff').Gpio;
var Rx = require('rx');

function OdometerObservable(gpioPin) {
  return Rx.Observable.create(function (observer) {
    
    var ts;
    var reedVal;

    var reed = new GPIO(gpioPin, 'in', 'both');
    reed.watch(function (err, value) {
        if(err) {
           throw err;
        }

        onReedSwitchEvent(value);
        if(value == 0) {
          onWheelRevolution();
        }
    });

    // WATCH GPIO CHANGES

    function onReedSwitchEvent(newValue) {
      reedVal = newValue;
      ts = new Date();

      // emit
    }

    function onWheelRevolution() {
      console.log('whiii!');

      var event = {
        type: 'wheelContact',
        timestamp: new Date()
      };

      observer.onNext( { name: 'Odometer', value: event } );

      // emit
      // observer....
    }



    var radius = 13.5;// tire radius (in inches)
    var circumference = 2*3.14*radius;

    var mph;
    
    var timer;// time between one full rotation (in ms)
    var maxReedCounter = 100;//min time (in ms) of one rotation (for debouncing)
    var reedCounter = maxReedCounter;

    function calculate() {
      if (reedVal){//if reed switch is closed
        if (reedCounter == 0){//min time between pulses has passed
          mph = (56.8*circumference) / timer;//calculate miles per hour
          timer = 0;//reset timer
          reedCounter = maxReedCounter;//reset reedCounter
        }
        else{
          if (reedCounter > 0){//don't let reedCounter go negative
            reedCounter -= 1;//decrement reedCounter
          }
        }
      }
      else{//if reed switch is open
        if (reedCounter > 0){//don't let reedCounter go negative
          reedCounter -= 1;//decrement reedCounter
        }
      }
      if (timer > 2000){
        mph = 0;//if no new pulses from reed switch- tire is still, set mph to 0
      }
      else{
        timer += 1;//increment timer
      }

      console.log('speed:', {
        mph: mph
      });
    }

    // EXIT CLEANUP
    // TODO: test!
    process.on('SIGINT', function () {
        reed.unexport();
        process.exit();
    });
  });
}

module.exports = OdometerObservable;
