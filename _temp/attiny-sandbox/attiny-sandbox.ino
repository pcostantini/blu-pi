
#define SWITCH 3
#define LED 4

int brightness = 0;    // how bright the LED is
int fadeAmount = 3;    // how many points to fade the LED by

int oneSec = 1000;
unsigned long last;
unsigned int lup = 0;     // wheel revolutions
unsigned int distance = 0;// in meters
int wheelC = 2136;        // 700cc x 28mm

//
// the setup routine runs once when you press reset:
void setup() {
  // initialize the LED pin as an output.
  pinMode(LED, OUTPUT);
  // initialize the SWITCH pin as an input.
  pinMode(SWITCH, INPUT);
  // ...with a pullup
  digitalWrite(SWITCH, HIGH);

  reset();
}

long lastDebounceTime = 0;  // the last time the output pin was toggled
long debounceDelay = 10;    // the debounce time; increase if the output flickers
int state = LOW;
bool ping() {

  //filter out any noise by setting a time buffer
  if ( (millis() - lastDebounceTime) > debounceDelay) {
    bool newState = !digitalRead(SWITCH);
    bool ping = (state != newState && newState == HIGH);
    state = newState;
    if(ping) lastDebounceTime = millis();
    return ping;
  }

  return false;
}

void loop() {
  if (ping()) {
    // !!!
    lup++;
    brightness = 255;
  }

  if ( (millis() - last) > oneSec) {
    // every one sec, update value and send it!
    updateAndSend();
    reset();
  }

  if (brightness > 0) {
    // reduce pulse
    brightness = brightness - fadeAmount;
  }

  analogWrite(LED, brightness);

  delay(1);
}

void updateAndSend() {
  distance = lup * wheelC;

  // TODO: Calculate speed
  // TODO: Send speed (& distance?)
}

void reset() {
  last = millis();
}

