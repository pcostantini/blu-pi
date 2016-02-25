// BLU-PI API:
/*
  ../api/session
    - list sessions
  ../api/session/current/
    - ?
  ../api/session/current/sensors
    - current session readouts
  ../api/session/current/sensors?type=Gps
    - current session gps readouts
*/
var Hapi = require('hapi');
var server = new Hapi.Server();

function init(currentPersistence) {

  server.connection({port: 3000});

  server.route({
    method: 'GET',
    path: '/',
    handler: function(req, reply) {
        // reply('Hello ' + req.params.yourname + '!')
       reply('Hello!');
    }
  });

  server.route({
    method: 'GET',
    path: '/api/session/current/sensors',
    handler: function(req, reply) {
      currentPersistence
        .retrieveAll()
        .then(reply, reply);
    }
  });

  server.start(() => console.log('http://localhost:3000/'));
}

module.exports = init;