#include <TinyWireS.h>
#ifndef TWI_RX_BUFFER_SIZE
#define TWI_RX_BUFFER_SIZE ( 16 )
#endif

#define I2C_SLAVE_ADDRESS 0x13
#define MAX_TICK 500

#define SWITCH 3
#define LED 4

int brightness = 0;    // how bright the LED is
int fadeAmount = 3;    // how many points to fade the LED by

unsigned int lup = 0;     // wheel revolutions
unsigned int distance = 0;// in meters
uint8_t speed = 0;
int wheelC = 2136;        // 700cc x 28mm

volatile uint8_t i2c_regs[] =
{
    0, //older 8
    0 //younger 8
};

volatile byte reg_position = 0;
const byte reg_size = sizeof(i2c_regs);

void requestEvent() {
  TinyWireS.send(speed);
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
}



long lastDebounceTime = 0;  // the last time the output pin was toggled
long debounceDelay = 15;    // the debounce time; increase if the output flickers
int state = LOW;
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
    speed++;    // TODO

//    i2c_regs[0] = speed >> 8;
//    i2c_regs[1] = speed & 0xFF;
    
    brightness = 255;
  }

  if (brightness > 0) {
    // reduce pulse
    brightness = brightness - fadeAmount;
  }

  analogWrite(LED, brightness);

  delay(1);
}


/*
volatile unsigned long Data1;//this is the data you are sending
volatile byte SendCount;
volatile uint8_t sendByte;

void requestEvent()
{  

  SendCount++; //increment this
  switch (SendCount)
  {
    case 1:
      Data1 = GetMyData();
      //Data1 = 55555;
      sendByte = Data1 & 0xFF;
      break;
    case 2:
      sendByte = Data1 >> 8;
      break;
    case 3:
      sendByte = Data1 >> 16;
      break;
    case 4:
      sendByte = Data1 >> 24;
      SendCount=0;
      break;
  }

  TinyWireS.send(sendByte);
}
*/
