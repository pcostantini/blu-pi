import time
import RPi.GPIO as io
io.setmode(io.BCM)
 
door_pin = 2
 
# io.setup(door_pin, io.IN, pull_up_down=io.PUD_UP)  # activate input with PullUp
io.setup(door_pin, io.IN)
 
while True:
    if not io.input(door_pin):
        print("pip!" + str(time.time()))
    time.sleep(0.5)
