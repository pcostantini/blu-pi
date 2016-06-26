var keypress = require('keypress');
var Rx = require('rxjs');

module.exports = function ConsoleInput() {

  var inputBack = new Rx.Subject();
  var inputNext = new Rx.Subject();
  var inputOk = new Rx.Subject();

  // make `process.stdin` begin emitting "keypress" events
  keypress(process.stdin);

  // listen for the "keypress" event
  process.stdin.on('keypress', function (ch, key) {

    if (key && key.ctrl && key.name == 'c') {
      process.stdin.pause();
      process.exit();
    }

    if (!key) return;

    switch (key.name) {
      case 'a':
        inputBack.next({ name: 'Input:A' });
        break;
      case 's':
        inputBack.next({ name: 'Input:B' });
        break;
      case 'd':
        inputBack.next({ name: 'Input:C' });
        break;
      case 'q':
        inputBack.next({ name: 'Input:LongA' });
        break;
      case 'w':
        inputBack.next({ name: 'Input:LongB' });
        break;
      case 'e':
        inputBack.next({ name: 'Input:LongC' });
        break;
      case 'space':
        inputBack.next({ name: 'Input:Space' });
        break;
    }
  });

  process.stdin.setRawMode(true);
  process.stdin.resume();

  return Rx.Observable.merge(inputBack, inputNext, inputOk)
    .share();
}