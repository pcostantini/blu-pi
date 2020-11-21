var Rx = require('rxjs');
var rpio = require('rpio');

rpio.init({ mapping: 'gpio' });

var longPressDelay = 500;
var gpioA = 16;
var gpioB = 26;
var gpioPush = 21;

function RotaryEncoderInputs() {

  var inputs = new Rx.Subject();

  function trigger(state) {
    inputs.next({ name: 'Input:' + state })
  }

  var push = false;
  var enc_prev_pos = 0;
  var enc_flags = 0;

  function handleUpdate(a, b) {

    // The following code was ported from:
    // https://learn.adafruit.com/trinket-usb-volume-knob/code

    var enc_action = 0; // 1 or -1 if moved, sign is direction

    // note: for better performance, the code will now use
    // direct port access techniques
    // http://www.arduino.cc/en/Reference/PortManipulation
    var enc_cur_pos = 0;
    // read in the encoder state first
    if (bit_is_clear(2, a)) {
      enc_cur_pos |= (1 << 0);
    }
    if (bit_is_clear(2, b)) {
      enc_cur_pos |= (1 << 1);
    }

    // if any rotation at all
    if (enc_cur_pos != enc_prev_pos)
    {
      if (enc_prev_pos == 0x00)
      {
        // this is the first edge
        if (enc_cur_pos == 0x01) {
          enc_flags |= (1 << 0);
        }
        else if (enc_cur_pos == 0x02) {
          enc_flags |= (1 << 1);
        }
      }

      if (enc_cur_pos == 0x03)
      {
        // this is when the encoder is in the middle of a "step"
        enc_flags |= (1 << 4);
      }
      else if (enc_cur_pos == 0x00)
      {
        // this is the final edge
        if (enc_prev_pos == 0x02) {
          enc_flags |= (1 << 2);
        }
        else if (enc_prev_pos == 0x01) {
          enc_flags |= (1 << 3);
        }

        // check the first and last edge
        // or maybe one edge is missing, if missing then require the middle state
        // this will reject bounces and false movements
        if (bit_is_set(enc_flags, 0) && (bit_is_set(enc_flags, 2) || bit_is_set(enc_flags, 4))) {
          enc_action = 1;
        }
        else if (bit_is_set(enc_flags, 2) && (bit_is_set(enc_flags, 0) || bit_is_set(enc_flags, 4))) {
          enc_action = 1;
        }
        else if (bit_is_set(enc_flags, 1) && (bit_is_set(enc_flags, 3) || bit_is_set(enc_flags, 4))) {
          enc_action = -1;
        }
        else if (bit_is_set(enc_flags, 3) && (bit_is_set(enc_flags, 1) || bit_is_set(enc_flags, 4))) {
          enc_action = -1;
        }

        enc_flags = 0; // reset for next time
      }
    }

    enc_prev_pos = enc_cur_pos;

    if (enc_action > 0) {
      moving = true;
      trigger(push ? 'LongA' : 'A');
    }
    else if (enc_action < 0) {
      moving = true;
      trigger(push ? 'LongC' : 'C');
    }

  }

  function handleInterrupt() {
    handleUpdate(rpio.read(gpioA), rpio.read(gpioB));
  }

  function bit_is_set(b, pos) {
     return (b & (1 << pos)) != 0;
  }

  function bit_is_clear(b, pos) {
    return !bit_is_set(b, pos)
  }

  function handlePush() {
    push = !rpio.read(gpioPush);
    if (!push && !moving) {
      if(Date.now() - lastPush >= longPressDelay) {
        trigger('LongB');
      } else {
        trigger('B');
      }
    } else if (push) {
      moving = false;
      lastPush = Date.now();
    }
  }

  rpio.open(gpioA, rpio.INPUT, rpio.PULL_UP);
  rpio.open(gpioB, rpio.INPUT, rpio.PULL_UP);
  rpio.open(gpioPush, rpio.INPUT, rpio.PULL_UP);
  rpio.poll(gpioA, handleInterrupt, rpio.POLL_BOTH);
  rpio.poll(gpioB, handleInterrupt, rpio.POLL_BOTH);
  rpio.poll(gpioPush, handlePush, rpio.POLL_BOTH);
  

  return inputs.share();
}

module.exports = RotaryEncoderInputs;