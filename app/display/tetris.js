module.change_code = 1;

var BaseDisplay = require('./base-display');
var inherits = require('util').inherits;
var tetrisGame = require('tetris/lib/tetris-game');

var width = 64;
var height = 128;
var tetrisDelay = 333;

function TetrisDisplay(driver, events, stateStore) {
    BaseDisplay.call(this, driver, events, stateStore);
}
inherits(TetrisDisplay, BaseDisplay);

TetrisDisplay.prototype.refreshDisplayDelay = 999999;
TetrisDisplay.prototype.rerouteInput = true;
TetrisDisplay.prototype.init = function (driver, stateStore) {
    //   drawMenu(driver, menu, state);
    tetrisGame.start(tetrisDelay);
    // tetrisGame.stop();
    tetrisGame.on('board_updated', () => drawBoard(driver, tetrisGame));
    this.paused = false;
}

TetrisDisplay.prototype.processEvent = function (driver, e, stateStore) {
    var move = getMovement(e.name);
    if (!move) return;

    if (move === 'Pause') {
        this.paused = !this.paused;
        this.rerouteInput = !this.paused;
        if (this.paused) {
            tetrisGame.stop();
        } else {
            tetrisGame.start(tetrisDelay);
        }
        return;
    }

    if(this.paused) return;

    // console.log('tetris', move);
    var over = tetrisGame.tryMove(move);
    // drawBoard(driver, tetrisGame);

    if (over || tetrisGame.getState() === tetrisGame.States.OVER) {
        console.log(' :( ', new Date().getTime())
        tetrisGame.start(tetrisDelay);
    }
}

function getMovement(evtName) {
    switch (evtName) {
        case 'Input:A':
            return tetrisGame.Moves.MoveLeft;
        case 'Input:C':
            return tetrisGame.Moves.MoveRight;
        case 'Input:B':
            return tetrisGame.Moves.RotClock;
        case 'Input:Shake':
            return tetrisGame.Moves.MoveDown;
        case 'Input:LongB':
            return 'Pause';
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

        driver.drawRect(x, y, zoom, zoom, bit, true);
        driver.fillRect(x + 2, y + 2, zoom, zoom, bit, false);
    }

    // ...
    var board = game.getBoard();
    for (var y = 0; y < board.length; y++) {
        var row = board[y];
        for (var x = 0; x < row.length; x++) {
            var bit = row[x];
            drawPixel(x, y, bit);
        }
    }
    // driver.drawPixel(pixel.x, pixel.y, 1);
    driver.display();
};