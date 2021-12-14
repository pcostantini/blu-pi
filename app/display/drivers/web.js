var _ = require('lodash');
var fs = require('fs');
var http = require('http');
var SocketIo = require('socket.io');

var httpPort = 8080;

// Mock Display that routes buffer data using socket.io
function WebDisplay(width, height) {

  this.bufferWidth = width;
  this.bufferHeight = height;
  this.rotation = 1;
  this.clear();

  this.init();

  console.log('\tWeb.Display.Driver ready @ ', httpPort);
}

WebDisplay.prototype.clear = function () {
  this.buffer = [];
  for (var y = 0; y < this.bufferHeight; y++) {
    this.buffer[y] = _.fill(Array(this.bufferWidth), 0);
  }
}

WebDisplay.prototype.setRotation = function (value) {
  this.rotation = value;
  console.log('set_rotation:', this.rotation)
  this.io.sockets.emit('set_rotation', this.rotation);
  this.io.sockets.emit('buffer', this.buffer);
}

// update single pixel in buffer
WebDisplay.prototype.drawPixel = function (x, y, color) {
  if (!this.buffer) return;

  x = Math.floor(x);
  y = Math.floor(y);

  // check rotation, move pixel around if necessary
  switch (this.rotation) {
    case 1:
      x = [y, y = x][0];//swap(x, y);
      x = this.bufferWidth - x - 1;
      break;
    case 3:
      x = [y, y = x][0];//swap(x, y);
      y = this.bufferHeight - y - 1;
      break;
    case 4:
      x = this.bufferWidth - x - 1;
      y = this.bufferHeight - y - 1;
      break;
  }

  if (x > this.bufferWidth - 1 || x < 0 ||
    y > this.bufferHeight - 1 || y < 0) return;

  var bit = !!color ? 1 : 0;
  this.buffer[y][x] = bit;
}

// send buffer to socket for redraw
WebDisplay.prototype.display = function () {
  this.io.sockets.emit('buffer', this.buffer);
}

WebDisplay.prototype.dim = function (dimmed) {
  this.io.sockets.emit('dim', dimmed);
}

WebDisplay.prototype.init = function () {
  // web server to host page with canvas
  var server = http.createServer(function (req, res) {
    // index.html
    fs.readFile(__dirname + '/web.html', function (err, data) {
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
  self.io = SocketIo.listen(server);
  self.io.sockets.on('connection', function (socket) {
    // console.log('WebDisplay:connected', socket.handshake)

    // send buffer on connect
    socket.emit('set_rotation', self.rotation);
    socket.emit('buffer', self.buffer);

    // recieve input events and broadcast them
    socket.on('input', function (e) {
      global.globalEvents_generator.next(e)
    });

  });

  server.listen(httpPort);
  this.inited = true;
}

module.exports = WebDisplay;
