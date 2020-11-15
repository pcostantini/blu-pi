# ATTINY85 ODOMETER

## Burner (using PI Hardware)

Follow instrutions from:

> https://www.instructables.com/id/Programming-the-ATtiny85-from-Raspberry-Pi/

## Pre-requisites

- Install **arduino-cli**:

  > https://arduino.github.io/arduino-cli/latest/installation/


- Install Arduino Cores:

  ```bash
  arduino-cli core update-index --additional-urls https://raw.githubusercontent.com/damellis/attiny/ide-1.6.x-boards-manager/package_damellis_attiny_index.json
  arduino-cli core install arduino:avr
  arduino-cli core install attiny:avr
  ```

- Install TinyWireS lib:

  ```bash
  unzip TinyWireS.zip -d TinyWireS
  mkdir -p ~/Arduino/libraries
  mv TinyWireS ~/Arduino/libraries/
  ```

- Build and Burn:

  ```bash
  ./compile.sh
  ./burn.sh
  ```


## Sources

- Arduino IDE ATTINY Board definitions:

  https://raw.githubusercontent.com/damellis/attiny/ide-1.6.x-boards-manager/package_damellis_attiny_index.json


- TinyWireS lib:

  https://github.com/rambo/TinyWire/tree/master/TinyWireS (TinyWireS.zip was cloned from this repo)
