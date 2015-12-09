function Odometer(gpioPin) {

    var radius = 13.5;// tire radius (in inches)
    var circumference = 2*3.14*radius;

    var mph;
    
    var reedVal;
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

    // WATCH GPIO CHANGES

    function onReedSwitchEvent(newValue) {
      reedVal = newValue;
    }

    function onWheelRevolution() {
      console.log('whiii!');
    }

    var GPIO = require('onoff').Gpio;
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

    // ON EXIT, cleanup
    process.on('SIGINT', function () {
        reed.unexport();
        process.exit();
    });

    // START
    // setInterval(calculate, 3);

    return {
      name: 'Odometer',
      emitter: null,  // TODO!
    };
}

module.exports = Odometer;
