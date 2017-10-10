#include <TinyWireS.h>
#include <math.h>

// Config
#define SWITCH 3
#define LED 4
float wheelRadius = 0.33995;        // 700cc x 28mm
float wheelCirc = 0;
int revolutionTimeout = 1500;

// LED Pulse
int brightness = 0;    // how bright the LED is
int fadeAmount = 3;    // how many points to fade the LED by
unsigned long lastFadeUpdate = 0;

// I2C Setup
#define I2C_SLAVE_ADDRESS 0x13
#ifndef TWI_RX_BUFFER_SIZE
#define TWI_RX_BUFFER_SIZE ( 16 )
#endif

// Speed!
int speed;
float distance;
volatile byte rotation;
float timetaken, rpm, dtime;
unsigned long pevtime;

// Data to transfer
// We are reading byte to byte, so we need a way to mark the end/start of each "byte stream"
volatile uint8_t i2c_regs[] =
{
  0x00,   // speed low byte
  0x00,   // speed high byte
  0x00,   // distance low byte
  0x00,   // distance high byte
  0x11,   // this two mark the end
  0x22
};
volatile byte reg_position;
const byte reg_size = sizeof(i2c_regs);

void requestEvent() {
  TinyWireS.send(i2c_regs[reg_position]);
  // Increment the reg position on each read, and loop back to zero
  reg_position++;
  if (reg_position >= reg_size)
  {
    reg_position = 0;
  }
}

void setup() {
  TinyWireS.begin(I2C_SLAVE_ADDRESS);
  TinyWireS.onRequest(requestEvent);

  // initialize the LED pin as an output.
  pinMode(LED, OUTPUT);
  // initialize the SWITCH pin as an input.
  pinMode(SWITCH, INPUT);
  // ...with a pullup
  digitalWrite(SWITCH, HIGH);

  wheelCirc = 2 * PI * wheelRadius;

  speed = 0;
  rotation = 0;
  rpm = 0;
  pevtime = 0;
  distance = 0;
}

// Check wheel rotation with debounce
long lastDebounceTime = 0;  // the last time the output pin was toggled
long debounceDelay = 15;    // the debounce time; increase if the output flickers
int state = LOW;
bool ping(unsigned long currentMillis) {
  //filter out any noise by setting a time buffer
  if ( (currentMillis - lastDebounceTime) > debounceDelay) {
    bool newState = !digitalRead(SWITCH);
    bool ping = (state != newState && newState == HIGH);
    state = newState;
    if (ping) lastDebounceTime = currentMillis;
    return ping;
  }

  return false;
}

void loop() {

  TinyWireS_stop_check();

  unsigned long currentMillis = millis();

  if (ping(currentMillis)) {
    brightness = 255;

    rotation++;
    distance += wheelCirc;

    int distanceInt = round(distance);
    
    i2c_regs[2] = lowByte(distanceInt);
    i2c_regs[3] = highByte(distanceInt);
    
    dtime = currentMillis;
    if (rotation >= 2)
    {
      timetaken = currentMillis - pevtime; //time in millisec
      rpm = (1000 / timetaken) * 60;
      pevtime = currentMillis;
      rotation = 0;
    }

  }

  // drop to zero if no revolutions were detected after a while
  if (currentMillis - dtime > revolutionTimeout)  {
    // reset
    rpm = 0;
    speed = 0;
    dtime = currentMillis;
  } else {
    // calc speed
    speed = (wheelRadius * rpm * 0.37699) * 10;
    i2c_regs[0] = lowByte(speed);
    i2c_regs[1] = highByte(speed);
  }

  // LED Pulse
  if (currentMillis - lastFadeUpdate > 5) {

    if (brightness > 0) {
      // reduce pulse
      brightness = brightness - fadeAmount;
    }

    analogWrite(LED, brightness);
    lastFadeUpdate = currentMillis;
  }

}
