module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var NoisyFilter = require('./noisy-filter');

function IpDisplay(driver, events, stateStore) {
    BaseDisplay.call(this, driver, events, stateStore);

    driver.setRotation(2);

    var ips = stateStore.getState().IpAddress || {};
    ips = Object.keys(ips).map(ip => ips[ip]);
    console.log(ips);

    ips.forEach((ip, ix) => {
        driver.setCursor(2, 2 + ix * 11);
        write(driver, ip);
    });

}
inherits(IpDisplay, BaseDisplay);

function write(driver, string) {
    var chars = string.split('');
    chars.forEach((c) => driver.write(c.charCodeAt(0)));
}

module.exports = IpDisplay;