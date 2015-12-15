#!/bin/bash -f

# reset oled
cd ~/Temp/Adafruit_Python_SSD1306/examples/
sudo python image.py

cd ~/Projects/pi-blu

SCREEN_NAME=blu

screen -dmS "$SCREEN_NAME"
screen -S "$SCREEN_NAME" -X stuff "supervisor main.js $(printf \\r)"

printf "Done,  now you can join your screen with :\n"
printf "$ screen -dr -S $SCREEN_NAME\n"
