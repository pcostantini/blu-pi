#!/bin/bash -f

SCREEN_NAME=blu

# TODO: backup last

screen -dmS "$SCREEN_NAME"
screen -S "$SCREEN_NAME" -X stuff "node --harmony app $(printf \\r)"

printf "Done,  now you can join cat-pi with :\n"
printf "$ screen -dr -S $SCREEN_NAME\n"
