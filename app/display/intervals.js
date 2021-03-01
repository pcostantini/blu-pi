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

var currentMenuIx = 1;
var menu = [
    {
        label: "GPS",
        callback: () => {
            // global.globalEvents_generator.next({ name: constants.START_GPS_REQUEST })
        }
    },
    {
        label: "CLEAR",
        callback: () => {
            intervalsMock.intervals = [];
            intervalsMock.best = null;
            intervalsMock.totalElapsed = 0;
            // global.globalEvents_generator.next({ name: constants.START_GPS_REQUEST })
        }
    },
    {
        label: "DST+",
        callback: () => {
            // global.globalEvents_generator.next({ name: constants.START_DIST_REQUEST })
        }
    },
];

var intervalsMock = {
    intervals: [
        // { elapsed: 635, startTime: new Date(), lapNumber: 1, distance: 6066 },
        // { elapsed: 611, startTime: new Date(), lapNumber: 2, distance: 6066 },
        // { elapsed: 633, startTime: new Date(), lapNumber: 3, distance: 6066 },
        // { elapsed: 999, startTime: new Date(), lapNumber: 4, distance: 6066 },
        // { elapsed: 743, startTime: new Date(), lapNumber: 5, distance: 6066 },
        // { elapsed: 612, startTime: new Date(), lapNumber: 6, distance: 6066 },
        // { elapsed: 676, startTime: new Date(), lapNumber: 7, distance: 6066 },
    ]
}
intervalsMock.best = _.minBy(intervalsMock.intervals, (e) => e.elapsed);
intervalsMock.totalElapsed = _.sum(intervalsMock.intervals.map(o => o.elapsed));
console.log(intervalsMock)

IntervalsDisplay.prototype.init = function (driver, stateStore) {
    driver.setRotation(2);
    drawMenu(driver, menu, currentMenuIx);
    drawIntervals(driver, intervalsMock.intervals);
    drawBest(driver, intervalsMock.best);
};

IntervalsDisplay.prototype.processEvent = function (driver, e, stateStore) {
    // // if (e.name === "Interval") {
    // //     if (intervals.length >= maxSize) {
    // //         y = startY;
    driver.display();
    // //         _.takeRight(intervals, maxSize - 1).forEach((i) =>
    // //             pushInterval(driver, i)
    // //         );
    // //     }

    // //     pushInterval(driver, e.value);
    // // } else 

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
        var filter = DottedFilter(driver);
        driver.fillRect(0, 0, 23, 64, 1);
        filter.dispose();

        driver.display();

        // invoke menu option
        // menu[currentMenuIx].callback();
    }
};

IntervalsDisplay.prototype.preFlush = function (driver, stateStore) {
    // TODO: extract!
    var last = _.last(intervalsMock.intervals) || { startTime: new Date() };
    var elapsed = new Date() - last.startTime;

    // TODO: draw Interval?

    drawCurrentInterval(driver, {
        elapsed: elapsed
    })
}

function drawCurrentInterval(driver, current) {
    var elapsed = toMMSS(current.elapsed);
    var label = `${elapsed}`.replace(/0/g, 'O',);

    driver.setTextColor(1, 0);
    driver.setTextSize(2);

    var filter = DottedFilter(driver, 1);
    driver.setCursor(55, 1);
    write(driver, label);
    driver.setCursor(54, 0);
    write(driver, label);
    filter.dispose();


}

function drawIntervals(driver, intervals) {
    // vertical |
    driver.drawLine(26, 0, 26, 64, 1);

    // last 4
    intervals = intervals.slice(-4).reverse();

    // best 4
    // intervals = _.orderBy(intervals, (e) => e.elapsed).slice(0, 4);

    var best = _.minBy(intervals, (e) => e.elapsed);
    intervals.forEach((interval, ix, t) => {
        var offset = 17;
        var y = offset + (ix * 10);

        driver.setCursor(32, y);
        driver.setTextColor(1, 0);
        driver.setTextSize(1);
        var time = toMMSS(interval.elapsed * 1000);
        var diff = (interval.elapsed - best.elapsed);
        if (diff) {
            diff = `   ${diff}+`;
            diff = diff.substring(diff.length - 4);
        } else {
            diff = '   /';
        }

        var string = ` ${diff} ${time}  ${interval.lapNumber}`;
        write(driver, string);

        var filter = DottedFilter(driver);
        driver.drawLine(
            68,
            y + 10 - 2,
            121,
            y + 10 - 2,
            1);
        filter.dispose();
    })
}

function drawBest(driver, interval) {
    // #
    driver.fillRect(28, 55, 94, 9, 1);
    driver.setCursor(32, 56);
    driver.setTextColor(0, 1);
    driver.setTextSize(1);
    if (interval) {
        var time = toMMSS(interval.elapsed * 1000);
        var kms = (Math.round(interval.distance / 100) / 10).toString();
        write(driver, `${kms}km ${time} (${interval.lapNumber})`);
    } else {
        driver.setCursor(66, 56);
        write(driver, `empty :(`);
    }
}

function drawMenu(driver, menu, currentMenuIx) {
    const textOffset = 7;

    // GPS
    curr = currentMenuIx === 0;
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
    driver.setCursor(1, 64 - textOffset - 6);
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


    // sep
    driver.drawLine(23, 0, 23, 64, 0);
    var filter = ScanlinesFilter(driver, 2);
    driver.drawLine(24, 0, 24, 64, 1);
    filter.dispose();

    driver.display();
}

// draw text
function write(driver, string) {
    var chars = string.split("");
    chars.forEach((c) => driver.write(c.charCodeAt(0)));
}

function toMMSS(ticks) {
    var sec_num = Math.round(ticks / 1000);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor(sec_num / 60);
    var seconds = sec_num % 60;

    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;
    return minutes + ":" + seconds;
}

// export
module.exports = IntervalsDisplay;
module.exports.constants = constants;
