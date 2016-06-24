#!/bin/bash -f

SCREEN_NAME=blu

# kill led lights
# echo 0 >/sys/class/leds/led0/brightness
# echo 0 >/sys/class/leds/led1/brightness

screen -dmS "$SCREEN_NAME"
screen -S "$SCREEN_NAME" -X stuff "node --harmony app $(printf \\r)"

printf "Done,  now you can join cat-pi with :\n"
printf "$ screen -dr -S $SCREEN_NAME\n"
