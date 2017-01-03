module.change_code = 1;

var BaseDisplay = require('./base-display');
var inherits = require('util').inherits;
var tetrisGame = require('tetris/lib/tetris-game');

var width = 64;
var height = 128;
var tetrisDelay = 666;

function TetrisDisplay(driver, events, stateStore) {
    BaseDisplay.call(this, driver, events, stateStore);
}
inherits(TetrisDisplay, BaseDisplay);

TetrisDisplay.prototype.refreshDisplayDelay = 10000;
TetrisDisplay.prototype.rerouteInput = true;
TetrisDisplay.prototype.init = function (driver, stateStore) {
    //   drawMenu(driver, menu, state);
    tetrisGame.start(tetrisDelay);

    // refreshInterval = setInterval(function() { drawBoard(driver, tetrisGame) }, 1000 / 60);
    drawBoard(driver, tetrisGame);
}

TetrisDisplay.prototype.processEvent = function(driver, e, stateStore) {
    var move = getMovement(e.name);
    if(!move) return;

    // console.log('tetris', move);
    tetrisGame.tryMove(move);


    if (tetrisGame.getState() === tetrisGame.States.OVER) {
        console.log('=(', new Date().getTime())
        tetrisGame.start(tetrisDelay);
    }
//   switch(e.name) {
//     // LEFT
//     case 'Input:Ok':
//       state.position++;
//       if(state.position >= menu.length) state.position = 0;
//       drawMenu(driver, menu, state);

//       break;

//     // RIGHT
//     case 'Input:Back':
//       state.executing = true;
//       drawMenu(driver, menu, state);

//       // execute
//       var menuItem = menu[state.position];
//       console.log('Menu.executing', menuItem);
//       menuItem.run();

//       setTimeout(() => {
//         state.executing = false;
//         drawMenu(driver, menu, state);
//       }, 1000);
//       break;
//   }
}

function getMovement(evtName) {
    switch(evtName) {
        case 'Input:Back':
            return tetrisGame.Moves.MoveLeft;
        case 'Input:Ok':
            return tetrisGame.Moves.MoveRight;
        case 'Input:Next':
            return tetrisGame.Moves.RotClock;
        case 'Input:Shake':
            return tetrisGame.Moves.MoveDown;
        default:
            return null;
    }
}

module.exports = TetrisDisplay;

function drawBoard(driver, game) {

    var zoom = 6;
    function drawPixel(x, y, bit) {
        x = x * zoom;
        y = 6 + y * zoom;

        driver.drawRect(x, y, zoom, zoom, bit);
    }

    // ...
    var board = game.getBoard();
    for(var y = 0; y < board.length; y++) {
        var row = board[y];
        for(var x = 0; x < row.length; x++) {
            var bit = row[x];
            drawPixel(x, y, bit);
        }
    }
    // driver.drawPixel(pixel.x, pixel.y, 1);


    driver.display();

    setTimeout(() => drawBoard(driver, game), 100)
};