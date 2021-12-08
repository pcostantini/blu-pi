module.change_code = 1;

function MaskFilter(driver) {

    driver._draw = driver.drawPixel;

    driver.drawPixel = function (x, y, color) {
        if (color) {
            driver._draw(x, y, 1);
        }
    };

    return {
        dispose: function () {
            // unwrap
            if (driver._draw) {
                driver.drawPixel = driver._draw;
                delete driver._draw;
            }
        }
    };
}

module.exports = MaskFilter;