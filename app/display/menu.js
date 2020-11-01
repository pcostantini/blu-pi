module.change_code = 1;

var inherits = require('util').inherits;
var BaseDisplay = require('./base-display');
var DottedFilter = require('./dotted-filter');

// TODO: move to config.js
var menu = require('../menu');
console.log('the menu is:', menu)

// add ...
menu = [{ name: '///', command: () => { } }]
  .concat(menu);
var lineHeight = 17
var state = { position: 0 };

function MenuDisplay(driver, events, stateStore) {
  BaseDisplay.call(this, driver, events, stateStore);
}

inherits(MenuDisplay, BaseDisplay);
MenuDisplay.prototype.init = function (driver, stateStore) {
  // reset =)
  this.refreshDisplayDelay = false;
  state = { position: 0 };
  drawMenu(driver, menu, state);
}

MenuDisplay.prototype.processEvent = function (driver, e, stateStore) {
  switch (e.name) {
    case 'Input:B':
      // next
      clearSelection(driver, menu, state);
      state.executing = false;
      state.position += 1
      if (state.position >= menu.length) state.position = 0;
      drawSelection(driver, menu, state);
      break;

    case 'Input:LongB':

      state.executing = true;
      driver.invert(true);
      drawSelection(driver, menu, state);


      // execute
      var menuItem = menu[state.position];
      console.log('Menu.executing', menuItem);
      menuItem.command();

      state.executing = false;

      // restore state
      setTimeout(() => {
        driver.invert(false);
        drawSelection(driver, menu, state);
      }, 1000);

      break;
  }
}

module.exports = MenuDisplay;

function clearSelection(driver, menu, state) {
  var y = 10 + state.position * lineHeight;
  driver.fillRect(60, y, 4, 4, false); // clear old box
}

function drawSelection(driver, menu, state) {
  menu
    .map((m, ix) => ({
      text: m.name,
      y: 10 + (ix * lineHeight),
      selected: ix === state.position
    }))
    .filter(o => o.selected)
    .forEach(m => drawMenuItem(driver, m, state));
  driver.display();
}

function drawMenu(driver, menu, state) {

  driver.clear();
  driver.setTextSize(2);
  driver.setTextColor(1, 0);
  driver.setTextWrap(false);

  console.log("drawMenu", menu)

  var p = menu.map((m, ix) => ({
    text: m.name,
    y: 10 + (ix * lineHeight),
    selected: ix === state.position
  }));

  p.push(p.splice(0, 1)[0]);
  p.unshift(p.find(o => o.selected));

  p.forEach(m => drawMenuItem(driver, m, state));

  driver.display();
}

function drawMenuItem(driver, item, state) {

  var y = item.y === 10 ? 94 : item.y;
  var filter = DottedFilter(driver);
  driver.fillRect(0, y - lineHeight, 64, lineHeight + 32, state.selected);
  filter.dispose();

  if (state.executing) {
    driver.fillRect(0, item.y, 64, lineHeight, state.executing);
    driver.setTextColor(0, 1);
  } else {
    driver.fillRect(0, item.y, 64, lineHeight, 0);
    driver.setTextColor(1, 0);
  }


  driver.setCursor(4, item.y);
  write(driver, item.text);

  if (item.selected) {
    driver.fillRect(58, item.y, 8, 9, false);
    driver.fillRect(60, item.y, 4, 4, true);
  }
}

function write(driver, string, bit) {
  var chars = string.split('');
  chars.forEach((c) => {
    driver.write(c.charCodeAt(0), bit);
  });
}