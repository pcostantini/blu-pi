#include <TinyWireS.h>

#define I2C_SLAVE_ADDRESS 0x13
#define MAX_TICK 500

#define SWITCH 3
#define LED 4

int brightness = 0;    // how bright the LED is
int fadeAmount = 3;    // how many points to fade the LED by

unsigned int lup = 0;     // wheel revolutions
unsigned int distance = 0;// in meters
int wheelC = 2136;        // 700cc x 28mm

void requestEvent() {
  TinyWireS.send(distance);
}

void setup() {
  TinyWireS.begin(I2C_SLAVE_ADDRESS);
  TinyWireS.onRequest(requestEvent);

  // initialize the LED pin as an output.
  // pinMode(LED, OUTPUT);
  // initialize the SWITCH pin as an input.
  pinMode(SWITCH, INPUT);
  // ...with a pullup
  digitalWrite(SWITCH, HIGH);
}



long lastDebounceTime = 0;  // the last time the output pin was toggled
long debounceDelay = 10;    // the debounce time; increase if the output flickers
int state = HIGH;
bool ping() {

  //filter out any noise by setting a time buffer
  if ( (millis() - lastDebounceTime) > debounceDelay) {
    bool newState = !digitalRead(SWITCH);
    bool ping = (state != newState && newState == HIGH);
    state = newState;
    if (ping) lastDebounceTime = millis();
    return ping;
  }

  return false;
}

void loop() {
  unsigned long currentMillis = millis();

  if (ping()) {
    // !!!
    lup++;
    distance = lup * wheelC;
    brightness = 255;
  }

  if (brightness > 0) {
    // reduce pulse
    brightness = brightness - fadeAmount;
  }

  // analogWrite(LED, brightness);

  delay(1);
}
