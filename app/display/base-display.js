module.change_code = 1;
var DottedFilter = require('./dotted-filter');

var cpuThreshold = 1.5;
var h = 64;
var w = 128;

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

  driver.setRotation(2)
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

  // vertical sep
  driver.drawLine(w - 5, 0, w - 5, h, 1);
  driver.drawLine(w - 4, 0, w - 4, h, 0);

  // refresh screen
  var bit = true;
  (function redraw(self) {

    self.preFlush(driver, stateStore);

    bit = !bit;
    drawBit(driver, bit);

    // update
    driver.display();

    if (!self.refreshDisplayDelay) return;

    self.timeout = setTimeout(
      () => redraw(self),
      self.refreshDisplayDelay);

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
BaseDisplay.prototype.width = 128;
BaseDisplay.prototype.height = 64;
BaseDisplay.prototype.rerouteInput = false;

module.exports = BaseDisplay;

// helpers
function drawBit(driver, bit) {
  driver.fillRect(w - 5, h - 6, 5, 5, 0)
  driver.fillRect(w - 5, h - 5, 5, 5, bit ? 1 : 0);
}

function drawCpu(driver, cpuState) {
  // portrait
  var maxSize = h - 7;
  var cpu = cpuState[0] < cpuThreshold ? cpuState[0] : cpuThreshold;
  var size = Math.round((maxSize / cpuThreshold) * (cpu));

  var filter = DottedFilter(driver);
  driver.fillRect(w - 3, 0, 5, maxSize, true);
  driver.fillRect(w - 3, size, 5, maxSize - size, false);
  filter.dispose();
}
