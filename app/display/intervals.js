module.change_code = 1;

const _ = require("lodash");
const inherits = require("util").inherits;
const BaseDisplay = require("./base-display");
const DottedFilter = require("./dotted-filter");
const ScanlinesFilter = require("./scanlines-filter");
const constants = require("../state/intervals").constants;

function IntervalsDisplay(driver, events, stateStore) {
    BaseDisplay.call(this, driver, events, stateStore);
}

inherits(IntervalsDisplay, BaseDisplay);

// Menu
var currentMenuIx = 1;
var menu = [
    {
        label: "GPS",
        callback: () => {
            global.globalEvents_generator.next({ name: constants.START_GPS_REQUEST })
        }
    },
    {
        label: "CLEAR",
        callback: () => {
            lastTimestamp = 0;
            global.globalEvents_generator.next({ name: constants.CLEAR })
        }
    },
    {
        label: "DST",
        callback: () => {
            global.globalEvents_generator.next({ name: constants.START_DIST_REQUEST })
        }
    },
];

// helper
function getIntervalsInfo(intervals) {
    var laps = (intervals || []).map((o, ix) => ({
        elapsed: o.time,
        startTime: o.timestamp,
        lapNumber: ix + 1,
        distance: o.distance
    }));

    var intervalsInfo = {
        laps: laps
    }
    intervalsInfo.best = _.minBy(laps, (e) => e.elapsed);
    intervalsInfo.totalElapsed = _.sum(laps.map(o => o.elapsed));
    intervalsInfo.totalDistance = _.sum(laps.map(o => o.distance));

    return intervalsInfo;
}

IntervalsDisplay.prototype.init = function (driver, stateStore) {
    driver.setRotation(2);

    var state = stateStore.getState();
    var intervals = getIntervalsInfo(state.Intervals);
    drawMenu(driver, menu, currentMenuIx);
    drawIntervals(driver, intervals.laps);
    drawBest(driver, intervals.best);

    // relocate menu
    if (state.IntervalLapStart) {
        currentMenuIx = state.IntervalLapStart.type === 'GPS' ? 0 : 2;
        drawMenu(driver, menu, currentMenuIx);
        disableMenu(driver);
    } else {
        drawMenu(driver, menu, currentMenuIx);
    }
};

IntervalsDisplay.prototype.processEvent = function (driver, e, stateStore) {
    if (e.name === 'Intervals') {
        var state = stateStore.getState();
        var intervals = getIntervalsInfo(state.Intervals);
        drawIntervals(driver, intervals.laps);
        drawBest(driver, intervals.best);
        driver.display();
    }

    if (e.name === "Input:A") {
        // PREV
        currentMenuIx -= 1;
        if (currentMenuIx < 0) {
            currentMenuIx = menu.length - 1;
        }

        drawMenu(driver, menu, currentMenuIx);

    } else if (e.name === "Input:C") {
        // NEXT
        currentMenuIx += 1;
        if (currentMenuIx > menu.length - 1) {
            currentMenuIx = 0;
        }

        drawMenu(driver, menu, currentMenuIx);

    } else if (e.name === "Input:B") {
        // SELECT
        disableMenu(driver);
        driver.display();

        // invoke menu option
        menu[currentMenuIx].callback();
    }
};

IntervalsDisplay.prototype.preFlush = function (driver, stateStore) {
    var elapsed = 0;
    var start = stateStore.getState().IntervalLapStart;
    if (start && start.time) {
        elapsed = Date.now() - start.time;
    }

    drawCurrentInterval(driver, { elapsed: elapsed })
}

function drawCurrentInterval(driver, current) {
    var elapsed = toMMSS(current.elapsed);
    var label = elapsed !== '00:00' ? `${elapsed}`.replace(/0/g, 'O',) : '--:--';

    driver.setTextColor(1, 0);
    driver.setTextSize(2);

    var x = 62;
    var filter = DottedFilter(driver);
    driver.setCursor(x + 1, 0);
    write(driver, label);
    driver.setCursor(x, 0);
    write(driver, label);
    filter.dispose();

    driver.display();
}

function drawIntervals(driver, intervals) {

    var best = _.minBy(intervals, (e) => e.elapsed);

    // last 4
    intervals = intervals.slice(-4).reverse();

    // best 4
    // intervals = _.orderBy(intervals, (e) => e.elapsed).slice(0, 4);

    var offset = 17;

    // clear?
    if (intervals.length === 0) {
        driver.fillRect(28, offset, 94, 37, 0)
        return;
    }
    intervals.reverse().forEach((interval, ix, t) => {
        var y = offset + (ix * 10);

        driver.setCursor(32, y);
        driver.setTextColor(1, 0);
        driver.setTextSize(1);
        var elapsed = toMMSS(interval.elapsed);
        var diff = (interval.elapsed - best.elapsed) / 1000;
        if (diff) {
            diff = `     ${Math.ceil(diff)}+`;
            diff = diff.slice(-6)
        } else {
            diff = '//////';
        }

        var string = ` ${interval.lapNumber} ${diff} ${elapsed}`;
        string = string.slice(-15)
        write(driver, string);
    });

    var filter = DottedFilter(driver);
    intervals.slice(1).forEach((interval, ix) => {
        var y = offset + ((ix) * 10);
        driver.drawLine(
            29,
            y + 10 - 2,
            121,
            y + 10 - 2,
            1);
    })
    filter.dispose();
}

function drawBest(driver, interval) {
    driver.fillRect(28, 55, 94, 9, 1);
    driver.setCursor(32, 56);
    driver.setTextColor(0, 1);
    driver.setTextSize(1);
    if (interval) {
        var time = toMMSS(interval.elapsed);
        var km = (interval.distance || 0).toFixed(2);
        var kms = '       ' + km.toString() + 'km ';
        if (kms.length > 7) kms = kms.slice(-7);
        var lap = interval.lapNumber > 9 ? interval.lapNumber : ` ${interval.lapNumber}`;
        write(driver, `${lap} ${kms}${time}`);
    } else {
        // empty
        driver.setCursor(84, 56);
        write(driver, `// ...`);
    }
}

function drawMenu(driver, menu, currentMenuIx) {
    const textOffset = 7;

    // GPS
    var curr = currentMenuIx === 0;
    driver.fillRect(0, 0, 23, 32, curr);

    driver.setTextSize(1);
    driver.setTextColor(!curr, curr);
    driver.setCursor(3, textOffset);
    write(driver, menu[0].label);

    // DISTANCE
    curr = currentMenuIx === 2;
    driver.fillRect(0, 64 - 32, 23, 32, curr);
    driver.setTextSize(1);
    driver.setTextColor(!curr, curr);
    driver.setCursor(3, 64 - textOffset - 6);
    write(driver, menu[2].label);

    // CLEAR
    curr = currentMenuIx === 1;
    const circleRadius = 7;
    if (!curr) {
        // shadow
        driver.fillCircle(11, 32, circleRadius + 5, curr);
        var filter = ScanlinesFilter(driver, 2);
        driver.fillCircle(11, 32, circleRadius + 3, !curr);
        driver.fillCircle(11, 32, circleRadius + 1, curr);
        filter.dispose();
        const xSize = 4;
        driver.drawLine(
            11 - (xSize / 2),
            32 - (xSize / 2),
            11 + (xSize / 2),
            32 + (xSize / 2),
            !curr);
        driver.drawLine(
            11 + (xSize / 2),
            32 - (xSize / 2),
            11 - (xSize / 2),
            32 + (xSize / 2),
            !curr);
    } else {
        // selected
        const xSize = 6;
        driver.fillCircle(11, 32, circleRadius + 5, 1);

        driver.drawLine(
            11 - (xSize / 2),
            32 - (xSize / 2),
            11 + (xSize / 2),
            32 + (xSize / 2),
            !curr);
        driver.drawLine(
            11 + (xSize / 2),
            32 - (xSize / 2),
            11 - (xSize / 2),
            32 + (xSize / 2),
            !curr);
    }

    // vertical |
    var filter = DottedFilter(driver);
    driver.drawLine(26, 0, 26, 64, 1);
    filter.dispose();
    // sep
    driver.drawLine(23, 0, 23, 64, 0);
    driver.drawLine(24, 0, 24, 64, 1);

    driver.display();
}

function disableMenu(driver) {
    var filter = DottedFilter(driver);
    driver.fillRect(0, 0, 23, 64, 1);
    filter.dispose();
}

// draw text
function write(driver, string) {
    var chars = string.split("");
    chars.forEach((c) => driver.write(c.charCodeAt(0)));
}

function toMMSS(ticks) {
    var sec_num = Math.round(ticks / 1000);
    // var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor(sec_num / 60);
    var seconds = sec_num % 60;

    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;
    var s = minutes + ":" + seconds;
    return s;
}

// export
module.exports = IntervalsDisplay;
module.exports.constants = constants;
