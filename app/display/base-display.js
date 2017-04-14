module.change_code = 1;
var DottedFilter = require('./dotted-filter');

function BaseDisplay(driver, events, stateStore) {
  var self = this;

  self.eventsSubscription = events.subscribe((e) => {
    try {
      self.processEvent(driver, e, stateStore);
    } catch (err) {
      console.log('Display.processEvent.err!', {
        err: err.toString(),
        stack: err.stack
      });
    }

    if (e.name === 'CpuLoad') {
      drawCpu(driver, e.value);
    }
  });

  driver.clear();

  try {
    self.init(driver, stateStore);
  } catch (err) {
    console.log('Display.init.err!', {
      err: err.toString(),
      stack: err.stack
    });
  }

  // first time, draw cpu
  var state = stateStore.getState();
  if (state && state.CpuLoad) {
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

    if (self.refreshDisplayDelay) {
      self.timeout = setTimeout(
        redraw.bind(null, self),
        self.refreshDisplayDelay);
    }

  })(self);
}

BaseDisplay.prototype.init = function (driver, stateStore) { }
BaseDisplay.prototype.preFlush = function (driver, stateStore) { }
BaseDisplay.prototype.processEvent = function (driver, e) { }
BaseDisplay.prototype.dispose = function () {
  console.log('disposed..')
  if (this.eventsSubscription) {
    this.eventsSubscription.unsubscribe();
    this.eventsSubscription = null;
  }

  if (this.timeout) {
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
  driver.fillRect(2, 0, 3, 3, 0)
  driver.fillRect(1, 0, 3, 3, bit ? 1 : 0);
}

function drawCpu(driver, cpuState) {
  var maxBarWidth = BaseDisplay.prototype.width - 2;
  var cpu = cpuState[0] < 2 ? cpuState[0] : 2;
  var cpuWidth = Math.round((maxBarWidth / 2) * (cpu));

  var filter = DottedFilter(driver);
  driver.fillRect(0, 0, BaseDisplay.prototype.height, 5, true);
  driver.fillRect(cpuWidth + 1, 1, maxBarWidth - cpuWidth, 2, false);
  filter.dispose();

  driver.drawLine(0, 3, BaseDisplay.prototype.width, 3, 0);
  driver.drawLine(0, 4, BaseDisplay.prototype.width, 4, 1);
}
