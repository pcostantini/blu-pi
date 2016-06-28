module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var NoisyFilter = require('./noisy-filter');

function OffDisplay(driver, events, stateStore) {
  BaseDisplay.call(this, driver, events, stateStore);
}
inherits(OffDisplay, BaseDisplay);

module.exports = OffDisplay;