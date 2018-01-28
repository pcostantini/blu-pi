 require('./app/sensors/odometer')().subscribe(console.log);


ethernet debugger plug!
ETH0				PI-GPIOs		PLUG--->PROTOBOARD1
					vi				0		orange *
					ground			0		blue *
					I2C				0		green /
					I2C				0		blue /
					gpio dm			0		brown *			--- oled reset
					gpio *			0		orange /		--- switch ?
					gpio *			0		brown /			--- switch ?
					gpio *			0		green *			--- switch ?



// 700c/29er	28 mm	622	28.00	678.00	2130.00

function storeSpeedInByte(speed) {
	return Math.round((((10/6) * (speed > 60 ? 60 : speed)) / 100) * 255);
}

// TODO
x Speed Averages
x Intervals
	 x Interval calculation
	 - Store
	 x Menu / Screen
	 ! Interval averages
x Demo mode with Replay 
- Pause
- New Menu options:
	- Pause
	- Off screen
x odometer
	x burner using pi host
	x arduino code
	- reed switch setup
- web ui for extracting route
	route cropping
	exporter to GPX
	automatic upload to strava
- gracefull dead on shutdown
	x exit program
	- clear screen
- wifi: on start, try to connect to everything open
	- menu: disable wifi (...and whole feature)
	? when enabled:
			auto try to connect to everything OPEN ROUTER!!!
			and maybe a few known routers

// OLED TINY!
http://www.instructables.com/id/ATTiny85-connects-to-I2C-OLED-display-Great-Things/
https://embeddedthoughts.com/2016/06/10/attiny85-debounce-your-pushbuttons/
https://github.com/reefab/CyclingPusher

// TOOLING 
- tools: convert gpx to session.sqlite3
- analyzer:
  stops detection: https://github.com/andrewhao/stoplight
	(Bike commuter stoplight detection from GPX files, implemented with FRP concepts)

// REDUCERS
- distance in the last quarters
	15': 2km
	30': 2.5km
	..
	every n' minutes, take a snapshot value
- graph:
	temperature
	distance
	altitude
	acceleration?

	
// IDEAS
	mostrar tus psible caminos basados en casos anterioreeees..
		.. sino mostrar maps de strava labs...
			desde donde estas...
			el resto
			recorrido realizado
			map tiles server required???

PERFORMANCE IMPROVEMENTS
- rewrite in C (yes! seriously! this was a concept and it kind of worked on a single cpu core rpi)


*********************************

kalman filter:
https://wouterbulten.nl/blog/tech/lightweight-javascript-library-for-noise-filtering/

raspivid start: 
https://www.reddit.com/r/raspberry_pi/comments/5gbpd4/raspberry_pi2_dash_cam_wadxl345_digital/
https://gist.github.com/anonymous/fba0802706f33428abcd1a612d1ae258

distance:
https://github.com/vanng822/gps-util/blob/master/lib/distance.js

// var wheelLoop = gpio.readPin(24, 0).select(as(1));
// wheelLoop.subscribe(() => console.log('...weeeee!'));

image to BUFFER:
http://javl.github.io/image2cpp/
timelapse:
https://www.raspberrypi.org/learning/cress-egg-heads/worksheet/

compass - code?
	http://ozzmaker.com/compass1/

map drawing on mobile
http://leafletjs.com/

cam soft:
 	https://github.com/iizukanao/picam
 	https://github.com/iizukanao/picam-streamer

? https://github.com/martinohanlon/pelmetcam
? https://www.npmjs.com/package/timestream-aggregates


light sensor:
https://blog.adafruit.com/2016/02/05/make-a-raspberry-pi-light-sensor-piday-raspberrypi-raspberry_pi/


*
*
*
*
*
*
***
// REFERENCES **************

"map display"
	draw gps coordinates on canvas, map lat/long to pixel:
	http://stackoverflow.com/questions/8898120/conversion-of-lat-lng-coordinates-to-pixels-on-a-given-map-with-javascript

"oled/ssd/Adafruit_GFX.js"
	https://communities.intel.com/message/237095#237095


// ATTINY I2C
https://github.com/DzikuVx/attiny_photoresistor_i2c
https://ladvien.com/robots/attiny-i2c/

// ARDUINO BIT SHIFTING
https://www.arduino.cc/en/Reference/Bitshift

// ATTINY FLASHING 
http://highlowtech.org/?p=1695
https://www.itopen.it/shrinked-arduino-flashing-an-attiny-85/


****
// shortcuts APPENDIX **************

node --harmony app
node --harmony app --demo
node --harmony app --demo --demoScheduled
node --harmony app --demo --demoFile ./data/dump/1605-mudanzas.sqlite3  --log

****
*
*
*
*
*





************************************************************

CHANGELOG
x screens: init progress display
    after a few startup screens
	init display at start
		1st thing! and starting showing something on screen
X MENU display: rudimentary display
x SOLDER GPIO PINS!!
  x do not fried pi the in proces
x safe reboot, shutdown -> input?
x replace
	x underscore -> lodash
	x rxjs -> XXkefir.jsxX -> rx5
	? gpio -> https://www.npmjs.com/package/rpi-gpio
x solder to gps shield
	x desolder lsm303 unused pins and extract
	x solder to board
	x solder LCD to board (cut pins first!)
	x wire up!
	...
x exports GPX data for sensors-1456605365387.sqlite3
	-> upload to strava to confirm total distance
x calculate distance from sensors-1456605365387.sqlite3
x test realtime stream with historicalscheduler and distance module
	https://github.com/Reactive-Extensions/RxJS/issues/243
	https://github.com/Reactive-Extensions/RxJS/blob/33105bd1225eb02e05bd7b43527f6d12e6d49a46/doc/api/schedulers/historicalscheduler.md
x implement basic speed / distance / time on display
x mock display on browser
x input/external i2c connector??
x ssh
x wifi support
! x merge .sqlite files -> TO main db
x on restart, replay points from DB
x menu: dim display
x cycle db
X start graphing crap!
x error loggin, treat errors as stream!
	X TEST!
	X how to: trap errors?
