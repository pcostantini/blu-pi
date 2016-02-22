#!/bin/bash -f

# reset oled
cd /home/pi/Temp/Adafruit_Python_SSD1306/examples/
sudo python image.py

# run blu-pi
cd "$(dirname "$0")"

SCREEN_NAME=blu

screen -dmS "$SCREEN_NAME"
screen -S "$SCREEN_NAME" -X stuff "node --harmony --expose-gc tracker $(printf \\r)"

printf "Done,  now you can join your screen with :\n"
printf "$ screen -dr -S $SCREEN_NAME\n"
