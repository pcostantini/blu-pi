function BaseDisplay(driver, eventsStream, state) {
  
  var self = this;

  self.init(driver, state);
  
  self.eventsSubscription = eventsStream.subscribe((event) => {
    try {
      self.processEvent(driver, state, event)
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

    driver.display();

    self.timeout = setTimeout(redraw.bind(null, self), self.refreshDisplayDelay);
  })(self);

}

BaseDisplay.prototype.refreshDisplayDelay = 1000;

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

module.exports = BaseDisplay;

// helpers
function drawBit(driver, bit) {
  driver.fillRect(0, 124, 4, 4, bit ? 1 : 0);
}