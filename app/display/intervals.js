module.change_code = 1;

var _ = require('lodash');
var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');

var DottedFilter = require('./dotted-filter');
var ScanlinesFilter = require('./scanlines-filter');

function IntervalsDisplay(driver, events, stateStore) {
    this.refreshDisplayDelay = 1000;
    BaseDisplay.call(this, driver, events, stateStore);
}

inherits(IntervalsDisplay, BaseDisplay);

var maxSize = 6;
var startY = 11;
var y = startY;
var intervals = [];
var lastTs = 0;

IntervalsDisplay.prototype.init = function (driver, stateStore) {

    y = startY;
    intervals = [];

    driver.clear();
    driver.setTextColor(1, 0);

    if(lastTs !== 0) {
        clearDisplay(driver);
        var last = _.takeRight(stateStore.getState().Intervals || [], maxSize);
        last.forEach((i) => pushInterval(driver, i));
    } else {
        // no intervals screen
        var lineSize = 28;
        var x1 = Math.round(32 - lineSize / 2 - 2);
        var y1 = Math.round(32 - lineSize / 2 - 2) + 32;
        driver.drawLine(x1, y1, x1 + lineSize, y1 + lineSize, 1);
        driver.drawCircle(x1 + lineSize / 2, y1 + lineSize / 2, lineSize / 2, 1);

        driver.setTextSize(1);
        driver.setCursor(14, 104)
        write(driver, 'please');
        driver.setCursor(17, 112)
        write(driver, 'start');
        driver.setCursor(8, 120)
        write(driver, 'interval');
    }
}

IntervalsDisplay.prototype.processEvent = function (driver, e, stateStore) {
    if (e.name === 'Interval') {
        if (intervals.length >= maxSize) {
            y = startY;
            _.takeRight(intervals, maxSize - 1)
                .forEach((i) => pushInterval(driver, i));
        }

        pushInterval(driver, e.value);
    } else if (e.name === 'Input:LongB') {
        // request start recording new interval, right now and here!
        global.globalEvents_generator.next({ name: 'Interval.StartRequest' });
        lastTs = Date.now();
        clearDisplay(driver);
    }
};

IntervalsDisplay.prototype.preFlush = function (driver, stateStore) {
    // show current timer
    if (!lastTs) return;

    driver.setTextSize(1);
    driver.setCursor(16, y + 5);
    var s = toMMSS(Date.now() - lastTs);
    write(driver, s);
};

function pushInterval(driver, interval) {
    intervals.push(interval);
    lastTs = interval.timestamp;

    var s = toMMSS(interval.time);

    var filter = DottedFilter(driver);
    driver.fillRect(2, y - 18, 60, 18, 0);
    filter.dispose();

    driver.fillRect(0, y, 64, 19, 0);

    driver.setTextSize(2);
    driver.setCursor(2, y);
    write(driver, s);
    y += 17;

    drawDrawer(driver);
}

function drawDrawer(driver) {
    driver.fillRect(0, y, 64, 15, false);
    driver.drawRect(0, y, 64, 2, true);
}

function clearDisplay(driver) {
    driver.clear();
    var filterA = DottedFilter(driver);
    var filterB = ScanlinesFilter(driver);
    driver.fillRect(0, 18, 64, 124, 1);
    filterB.dispose();
    filterA.dispose();

    drawDrawer(driver);
}

// draw text
function write(driver, string) {

    var chars = string.split('');
    var last = '';
    chars.forEach((c) => {
        // if(c === ':') {
        //     var pos = driver.getCursor();
        //     driver.setCursor(pos[0] - 4, pos[1]);
        // }

        // if(last === ':') {
        //     var pos = driver.getCursor();
        //     driver.setCursor(pos[0] - 4, pos[1]);
        // }
        driver.write(c.charCodeAt(0));
        last = c;
    });
}

function toMMSS(ticks) {
    var sec_num = Math.round(ticks / 1000);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor(sec_num / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;
    return minutes + ':' + seconds;
}

// export
module.exports = IntervalsDisplay;