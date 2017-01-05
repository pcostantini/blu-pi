module.change_code = 1;

function BaseDisplay(driver, events, stateStore) {
  var self = this;
  
  self.eventsSubscription = events.subscribe((e) => {
    try {
      self.processEvent(driver, e, stateStore);
    } catch(err) {
      console.log('Display.processEvent.err!', {
        err: err.toString(),
        stack: err.stack
      });
    }

    if(e.name === 'CpuLoad') {
      drawCpu(driver, e.value);
    }
  });

  driver.clear();

  try {
    self.init(driver, stateStore);
  } catch(err) {
    console.log('Display.init.err!', {
      err: err.toString(),
      stack: err.stack
    });
  }

  // first time, draw cpu
  var state = stateStore.getState();
  if(state && state.CpuLoad) {
    drawCpu(driver, state.CpuLoad);
  }

  // refresh screen
  var bit = true;
  (function redraw(self) {

    self.preFlush(driver, stateStore);

    bit = !bit;
    drawBit(driver, bit);

    // update and repeat
    driver.display();

    if(self.refreshDisplayDelay) {
      self.timeout = setTimeout(
        redraw.bind(null, self),
        self.refreshDisplayDelay);
    }

  })(self);

}
BaseDisplay.prototype.preFlush = function(driver, stateStore) { }
BaseDisplay.prototype.processEvent = function(driver, e) { }
BaseDisplay.prototype.dispose = function() {
  console.log('disposed..')
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
BaseDisplay.prototype.rerouteInput = false;

module.exports = BaseDisplay;

// helpers
function drawBit(driver, bit) {
  driver.fillRect(1, 0, 4, 4, bit ? 1 : 0);
  // driver.fillRect(1, 1, 3, 3, bit ? 0 : 1);
}

function drawCpu(driver, cpuState) {
  driver.fillRect(0, 0, BaseDisplay.prototype.height, 4, true);
  var maxBarWidth = BaseDisplay.prototype.width - 2;
  var cpu = cpuState[0] < 2 ? cpuState[0] : 2;
  var cpuWidth = Math.round((maxBarWidth / 2) * (cpu));
  driver.fillRect(cpuWidth + 1, 1, maxBarWidth - cpuWidth - 1, 2, false);
}
