# compile
# arduino --verify blink.ino --pref build.path=./build

# burn
sudo gpio -g mode 22 out
sudo gpio -g write 22 0
sudo /usr/local/bin/avrdude -p t85 -P /dev/spidev0.0 -c linuxspi -b 10000 -U flash:w:attiny-sandbox.ino.tiny8.hex
sudo gpio -g write 22 1
