module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var NoisyFilter = require('./noisy-filter');

function IpDisplay(driver, events, stateStore) {
    BaseDisplay.call(this, driver, events, stateStore);
    driver.setRotation(2);

    var ips = stateStore.getState().IpAddress || {};
    printIps(driver, ips);
}
inherits(IpDisplay, BaseDisplay);

IpDisplay.prototype.processEvent = function (driver, e, stateStore) {
    switch (e.name) {
      case 'IpAddress':
          printIps(driver, e.value);
          break;
    }
}

function printIps(driver, ips) {
    ips = Object.keys(ips).map(ip => ips[ip]);
    ips.unshift('-.-');

    driver.setTextSize(1);
    driver.setTextColor(1, 0);

    ips.forEach((ip, ix) => {
        driver.setCursor(2, 2 + ix * 11);
        write(driver, ip);
    });
}

function write(driver, string) {
    var chars = string.split('');
    chars.forEach((c) => driver.write(c.charCodeAt(0)));
}

module.exports = IpDisplay;
