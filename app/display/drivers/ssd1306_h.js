// credit: https://communities.intel.com/message/237095#237095

var SSD1306 ={};
//SSD1306.I2C_ADDRESS = 0x3C;	// 011110+SA0+RW - 0x3C or 0x3D
// Address for 128x32 is 0x3C
// Address for 128x64 is 0x3D (default) or 0x3C (if SA0 is grounded)
SSD1306.I2C_ADDRESS = 0x3D; //i2c address of 128x64 ebay oled module
/*=========================================================================
    SSD1306 Displays
    -----------------------------------------------------------------------
    The driver is used in multiple displays (128x64, 128x32, etc.).
    Select the appropriate display below to create an appropriately
    sized framebuffer, etc.

    SSD1306.SCREENTYPE_128_64  128x64 pixel display

    SSD1306.SCREENTYPE_128_32  128x32 pixel display

    -----------------------------------------------------------------------*/
   SSD1306.SCREENTYPE_128_64 = true;
  //SSD1306.SCREENTYPE_128_32 = true;
/*=========================================================================*/

if(SSD1306.SCREENTYPE_128_64 && SSD1306.SCREENTYPE_128_32) {
  throw new Error('Only one SSD1306 display can be specified at once in SSD1306_h.js');
}
else if(SSD1306.SCREENTYPE_128_64 == undefined && SSD1306.SCREENTYPE_128_32 == undefined) {
  throw new Error('At least one SSD1306 display must be specified in SSD1306_h.js');
}

if(SSD1306.SCREENTYPE_128_64)
{
  SSD1306.LCDWIDTH = 128;
  SSD1306.LCDHEIGHT = 64;
}
else if(SSD1306.SCREENTYPE_128_32)
{
  SSD1306.LCDWIDTH = 128;
  SSD1306.LCDHEIGHT = 32;
}

SSD1306.SETCONTRAST = 0x81;
SSD1306.DISPLAYALLON_RESUME = 0xA4;
SSD1306.DISPLAYALLON = 0xA5;
SSD1306.NORMALDISPLAY = 0xA6;
SSD1306.INVERTDISPLAY = 0xA7;
SSD1306.DISPLAYOFF = 0xAE;
SSD1306.DISPLAYON = 0xAF;

SSD1306.SETDISPLAYOFFSET = 0xD3;
SSD1306.SETCOMPINS = 0xDA;

SSD1306.SETVCOMDETECT = 0xDB;

SSD1306.SETDISPLAYCLOCKDIV = 0xD5;
SSD1306.SETPRECHARGE = 0xD9;

SSD1306.SETMULTIPLEX = 0xA8;

SSD1306.SETLOWCOLUMN = 0x00;
SSD1306.SETHIGHCOLUMN = 0x10;

SSD1306.SETSTARTLINE = 0x40;

SSD1306.MEMORYMODE = 0x20;
SSD1306.COLUMNADDR = 0x21;
SSD1306.PAGEADDR = 0x22;

SSD1306.COMSCANINC = 0xC0;
SSD1306.COMSCANDEC = 0xC8;

SSD1306.SEGREMAP = 0xA0;

SSD1306.CHARGEPUMP = 0x8D;

SSD1306.EXTERNALVCC = 0x1;
SSD1306.SWITCHCAPVCC = 0x2;

// Scrolling #defines
SSD1306.ACTIVATE_SCROLL = 0x2F;
SSD1306.DEACTIVATE_SCROLL = 0x2E;
SSD1306.SET_VERTICAL_SCROLL_AREA = 0xA3;
SSD1306.RIGHT_HORIZONTAL_SCROLL = 0x26;
SSD1306.LEFT_HORIZONTAL_SCROLL = 0x27;
SSD1306.VERTICAL_AND_RIGHT_HORIZONTAL_SCROLL = 0x29;
SSD1306.VERTICAL_AND_LEFT_HORIZONTAL_SCROLL = 0x2A;

SSD1306.BLACK = 0;
SSD1306.WHITE = 1;

module.exports = SSD1306;