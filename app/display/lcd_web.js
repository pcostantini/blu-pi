var _ = require('lodash');
var fs = require('fs');
var http = require('http');
var SocketIo = require('socket.io');

var httpPort = 8080;

// Mock Display that routes buffer data using socket.io
function LcdMock(width, height) {
  
  this.bufferWidth =  width;
  this.bufferHeight = height;
  this.clear();

  // web server to host page with canvas
  var server = http.createServer(function (req, res) {
    // index.html
    fs.readFile(__dirname + '/lcd_web.html', function (err, data) {
      if (err) {
          res.writeHead(500);
          return res.end('Error loading index.html');
      }

      // return page
      res.writeHead(200);
      res.end(data);
    });
  });



  // open socket server
  var self = this;
  var io = SocketIo.listen(server);
  io.sockets.on('connection', function (socket) {
    // send buffer on connect
    socket.emit('buffer', self.buffer);
  });

  this.io = io;

  server.listen(httpPort);
}

DisplayMock.prototype.clear = function() {
  this.buffer = [];
  for(var y=0; y<this.bufferHeight; y++) {
    this.buffer[y] = _.fill(Array(this.bufferWidth), 0);
  }
}

// update single pixel in buffer
DisplayMock.prototype.drawPixel = function(x, y, color) {
  x = Math.round(x);
  y = Math.round(y);
  if(x > this.bufferWidth-1 || x < 0 ||
     y > this.bufferHeight-1 || y < 0) return;

  var bit = !!color ? 1 : 0;
  this.buffer[y][x] = bit;
}

DisplayMock.prototype.display = function() {
  // send buffer to socket for redraw
  this.io.sockets.emit('buffer', this.buffer);
}

module.exports = LcdMock;