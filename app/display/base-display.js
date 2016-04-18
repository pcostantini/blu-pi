module.change_mode = 1;

function BaseDisplay(driver, eventsStream, state) {
  var self = this;
  self.init(driver, state);
  
  self.eventsSubscription = eventsStream.subscribe((e) => {
    try {

      if(e.name === 'CpuLoad') {
        console.log('cpu', e.value);
        drawCpu(driver, e.value);
      }

      self.processEvent(driver, state, e);

    } catch(err) {
      console.log('Display.processEvent.err!', {
        err: err.toString(),
        stack: err.stack
      });
    }
  });


  // refresh screen
  var bit = true;
  (function redraw(self) {

    self.heartbeat(driver);

    bit = !bit;
    drawBit(driver, bit);

    // update and repeat
    driver.display();
    self.timeout = setTimeout(redraw.bind(null, self), self.refreshDisplayDelay);

  })(self);

}
BaseDisplay.prototype.heartbeat = function() { }
BaseDisplay.prototype.processEvent = function() { }
BaseDisplay.prototype.dispose = function() {
  if(this.eventsSubscription) {
    this.eventsSubscription.unsubscribe();
  }

  if(this.timeout) {
    clearTimeout(this.timeout);
  }
}

BaseDisplay.prototype.refreshDisplayDelay = 1000;
BaseDisplay.prototype.width = 64;
BaseDisplay.prototype.height = 128;

module.exports = BaseDisplay;

// helpers
function drawBit(driver, bit) {
  driver.fillRect(0, 124, 4, 4, bit ? 1 : 0);
}

function drawCpu(driver, cpuState) {
  driver.fillRect(0, 0, BaseDisplay.prototype.height, 4, true);
  var maxBarWidth = BaseDisplay.prototype.width - 2;
  var cpu = cpuState[0] < 2 ? cpuState[0] : 2;
  var cpuWidth = Math.round((maxBarWidth / 2) * (cpu));
  driver.fillRect(cpuWidth + 1, 1, maxBarWidth - cpuWidth - 1, 2, false);
}
