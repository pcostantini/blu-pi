sudo gpio -g mode 22 out
sudo gpio -g write 22 0
# set to 8mhz
sudo /usr/local/bin/avrdude -p t85 -P /dev/spidev0.0 -c linuxspi -b 10000 -U lfuse:w:0xe2:m -U hfuse:w:0xdf:m -U efuse:w:0xff:m
# burn
sudo /usr/local/bin/avrdude -p t85 -P /dev/spidev0.0 -c linuxspi -b 10000 -U flash:w:attiny-sandbox.ino.tiny8.hex
sudo gpio -g write 22 1
