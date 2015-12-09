![‘npm version’](http://img.shields.io/npm/v/oled-js.svg?style=flat) ![‘downloads over month’](http://img.shields.io/npm/dm/oled-js.svg?style=flat)

OLED JS Pi
========================

![oled-cat](http://f.cl.ly/items/2G041X2C1o2A1n2D3S18/cat-oled.png)

## What is this?

A NodeJS driver for I2C/SPI compatible monochrome OLED screens; to be used on the Raspberry Pi! Works with 128 x 32, 128 x 64 and 96 x 16 sized screens, of the SSD1306 OLED/PLED Controller (read the [datasheet here](http://www.adafruit.com/datasheets/SSD1306.pdf)).

This based on the Blog Post and code by Suz Hinton - [Read her blog post about how OLED screens work](http://meow.noopkat.com/oled-js/)!

OLED screens are really cool - now you can control them with JavaScript!

## Install

If you haven't already, install [NodeJS](http://nodejs.org/).

`npm install oled-js-bpi`

## I2C screens
Hook up I2C compatible oled to the Raspberry Pi and Banana Pi. Pins: SDL and SCL

### I2C example

```javascript
var oled = require('oled-js-pi');

var opts = {
  width: 128,
  height: 64,
  address: 0x3D, //default is 0x3C
  device: "/dev/i2c-2" //default is /dev/i2c-0
};

var oled = new oled(opts);

// do cool oled things here

```

### Wait, how do I find out the I2C address of my OLED screen?
Check your screen's documentation...

## Available methods

### clearDisplay
Fills the buffer with 'off' pixels (0x00). Optional bool argument specifies whether screen updates immediately with result. Default is true.

Usage:
```javascript
oled.clearDisplay();
```

### dimDisplay
Lowers the contrast on the display. This method takes one argument, a boolean. True for dimming, false to restore normal contrast.

Usage:
```javascript
oled.dimDisplay(true|false);
```

### invertDisplay
Inverts the pixels on the display. Black becomes white, white becomes black. This method takes one argument, a boolean. True for inverted state, false to restore normal pixel colors.

Usage:
```javascript
oled.invertDisplay(true|false);
```

### turnOffDisplay
Turns the display off.

Usage:
```javascript
oled.turnOffDisplay();
```

### turnOnDisplay
Turns the display on.

Usage:
```javascript
oled.turnOnDisplay();
```


### drawPixel
Draws a pixel at a specified position on the display. This method takes one argument: a multi-dimensional array containing either one or more sets of pixels.

Each pixel needs an x position, a y position, and a color. Colors can be specified as either 0 for 'off' or black, and 1 or 255 for 'on' or white.

Optional bool as last argument specifies whether screen updates immediately with result. Default is true.

Usage:
```javascript
// draws 4 white pixels total
// format: [x, y, color]
oled.drawPixel([
	[128, 1, 1],
	[128, 32, 1],
	[128, 16, 1],
	[64, 16, 1]
]);
```

### drawLine
Draws a one pixel wide line.

Arguments:
+ int **x0, y0** - start location of line
+ int **x1, y1** - end location of line
+ int **color** - can be specified as either 0 for 'off' or black, and 1 or 255 for 'on' or white.

Optional bool as last argument specifies whether screen updates immediately with result. Default is true.

Usage:
```javascript
// args: (x0, y0, x1, y1, color)
oled.drawLine(1, 1, 128, 32, 1);
```

### fillRect
Draws a filled rectangle.

Arguments:
+ int **x0, y0** - top left corner of rectangle
+ int **x1, y1** - bottom right corner of rectangle
+ int **color** - can be specified as either 0 for 'off' or black, and 1 or 255 for 'on' or white.

Optional bool as last argument specifies whether screen updates immediately with result. Default is true.

Usage:
```javascript
// args: (x0, y0, x1, y1, color)
oled.fillRect(1, 1, 10, 20, 1);
```

### drawBitmap
Draws a bitmap using raw pixel data returned from an image parser. The image sourced must be monochrome, and indexed to only 2 colors. Resize the bitmap to your screen dimensions first. Using an image editor or ImageMagick might be required.

Optional bool as last argument specifies whether screen updates immediately with result. Default is true.

Tip: use a NodeJS image parser to get the pixel data, such as [pngparse](https://www.npmjs.org/package/pngparse). A demonstration of using this is below.


Example usage:
```
npm install pngparse
```

```javascript
var pngparse = require('pngparse');

pngparse.parseFile('indexed_file.png', function(err, image) {
	oled.drawBitmap(image.data);
});
```

This method is provided as a primitive convenience. A better way to display images is to use NodeJS package [png-to-lcd](https://www.npmjs.org/package/png-to-lcd) instead. It's just as easy to use as drawBitmap, but is compatible with all image depths (lazy is good!). It will also auto-dither if you choose. You should still resize your image to your screen dimensions. This alternative method is covered below:

```
npm install png-to-lcd
```

```javascript
var pngtolcd = require('png-to-lcd');

pngtolcd('nyan-cat.png', true, function(err, bitmap) {
  oled.buffer = bitmap;
  oled.update();
});
```

### startScroll
Scrolls the current display either left or right.
Arguments:
+ string **direction** - direction of scrolling. 'left' or 'right'
+ int **start** - starting row of scrolling area
+ int **stop** - end row of scrolling area

Usage:
```javascript
// args: (direction, start, stop)
oled.startscroll('left', 0, 15); // this will scroll an entire 128 x 32 screen
```

### stopScroll
Stops all current scrolling behaviour.

Usage:
```javascript
oled.stopscroll();
```

### setCursor
Sets the x and y position of 'cursor', when about to write text. This effectively helps tell the display where to start typing when writeString() method is called.

Call setCursor just before writeString().

Usage:
```javascript
// sets cursor to x = 1, y = 1
oled.setCursor(1, 1);
```

### writeString
Writes a string of text to the display.  
Call setCursor() just before, if you need to set starting text position.

Arguments:
+ obj **font** - font object in JSON format (see note below on sourcing a font)
+ int **size** - font size, as multiplier. Eg. 2 would double size, 3 would triple etc.
+ string **text** - the actual text you want to show on the display.
+ int **color** - color of text. Can be specified as either 0 for 'off' or black, and 1 or 255 for 'on' or white.
+ bool **wrapping** - true applies word wrapping at the screen limit, false for no wrapping. If a long string without spaces is supplied as the text, just letter wrapping will apply instead.

Optional bool as last argument specifies whether screen updates immediately with result. Default is true.

Before all of this text can happen, you need to load a font buffer for use. A good font to start with is NodeJS package [oled-font-5x7](https://www.npmjs.org/package/oled-font-5x7).

Usage:
```
npm install oled-font-5x7
```

```javascript
var font = require('oled-font-5x7');

// sets cursor to x = 1, y = 1
oled.setCursor(1, 1);
oled.writeString(font, 1, 'Cats and dogs are really cool animals, you know.', 1, true);
```

### update
Sends the entire buffer in its current state to the oled display, effectively syncing the two. This method generally does not need to be called, unless you're messing around with the framebuffer manually before you're ready to sync with the display. It's also needed if you're choosing not to draw on the screen immediately with the built in methods.

Usage:
```javascript
oled.update();
```
