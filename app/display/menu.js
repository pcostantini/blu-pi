module.change_code = 1;

var BaseDisplay = require('./base-display');
var inherits = require('util').inherits;
var menu = require('../menu');

menu = [{
    name: ' ',
    command: () => { console.log('*', new Date()) }
  }].concat(menu);

console.log(menu)

var width = 64;
var height = 128;
var lineHeight = 12;
var state = { position: 0 };

function MenuDisplay(driver, events, stateStore) {
  BaseDisplay.call(this, driver, events, stateStore);
}

inherits(MenuDisplay, BaseDisplay);
MenuDisplay.prototype.init = function (driver, stateStore) {
  drawMenu(driver, menu, state);
}

MenuDisplay.prototype.processEvent = function (driver, e, stateStore) {
  switch (e.name) {
    case 'Input:B':
    case 'Input:A':
    case 'Input:C':
      clearSelection(driver, menu, state);
      state.executing = false;
      state.position += (e.name === 'Input:A') ? -1 : 1;
      if (state.position >= menu.length) state.position = 0;
      drawSelection(driver, menu, state);
      break;

    case 'Input:LongB':
      state.executing = true;
      drawSelection(driver, menu, state);

      // execute
      var menuItem = menu[state.position];
      console.log('Menu.executing', menuItem);
      menuItem.command();

      // restore state
      setTimeout(() => {
        state.executing = false;
        drawSelection(driver, menu, state);
      }, 1000);
      
      break;
  }
}

module.exports = MenuDisplay;

function clearSelection(driver, menu, state) {
  var y = 10 + state.position * lineHeight;
  driver.fillRect(2, y + 3, 4, 4, false);
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

  driver.fillRect(0, 4, 64, 124, false);
  driver.setTextSize(1);
  driver.setTextColor(1, 0);
  driver.setTextWrap(false);

  console.log("drawMenu", menu)

  menu.map((m, ix) => ({
    text: m.name,
    y: 10 + (ix * lineHeight),
    selected: ix === state.position
  })).forEach(m => drawMenuItem(driver, m, state));

  driver.display();
}

function drawMenuItem(driver, item, state) {
  driver.setCursor(8, item.y);
  write(driver, item.text);

  if (item.selected) {
    if (state.executing) {
      driver.fillRect(2, item.y + 3, 4, 4, true);
    } else {
      driver.fillRect(2, item.y + 3, 4, 4, false);
      driver.drawRect(2, item.y + 3, 4, 4, true);
    }
  }
}

function write(driver, string) {
  var chars = string.split('');
  chars.forEach((c) => {
    driver.write(c.charCodeAt(0));
  });
}