#!/bin/bash -f

SCREEN_NAME=blu

screen -dmS "$SCREEN_NAME"
screen -S "$SCREEN_NAME" -X stuff "node --harmony --expose-gc app $(printf \\r)"

printf "Done,  now you can join your screen with :\n"
printf "$ screen -dr -S $SCREEN_NAME\n"
