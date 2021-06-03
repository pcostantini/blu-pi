# rasperrypi burn

# set to 8mhz
sudo gpio -g mode 22 out
sudo gpio -g write 22 0
sudo avrdude -p t85 -P /dev/spidev0.0 -c linuxspi -b 10000 -U lfuse:w:0xe2:m -U hfuse:w:0xdf:m -U efuse:w:0xff:m
sudo gpio -g write 22 1

# burn
sudo gpio -g mode 22 out
sudo gpio -g write 22 0
sudo avrdude -V -p t85 -P /dev/spidev0.0 -c linuxspi -b 10000 -U flash:w:./build/attiny_brain.ino.hex
sudo gpio -g write 22 1
