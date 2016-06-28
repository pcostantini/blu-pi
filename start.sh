#!/bin/bash -f

SCREEN_NAME=blu

# kill led lights
# echo 0 >/sys/class/leds/led0/brightness
# echo 0 >/sys/class/leds/led1/brightness

screen -dmS "$SCREEN_NAME"
screen -S "$SCREEN_NAME" -X stuff "check_cycle_and_start.sh $(printf \\r)"

printf "Starting... now you can view blu-pi with :\n"
printf "$ screen -dr -S $SCREEN_NAME\n"
