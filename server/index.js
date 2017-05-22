// BLU-PI API:
/*
  ../api/sessions
    - list sessions
  ../api/sessions/current/
    - ?
  ../api/sessions/current/sensors
    - current session readouts
  ../api/sessions/current/sensors?type=Gps
    - current session gps readouts
*/
var hapi = require('hapi');
var server = new hapi.Server();

function init(currentPersistence) {

  server.connection({ port: 3000 });

  server.route({
    path: '/', method: 'GET',
    handler: (req, reply) => {
      // reply('Hello ' + req.params.yourname + '!')
      reply('Hello!');
    }
  });

  server.route({
    path: '/api/sessions/current/sensors', method: 'GET',
    handler: (req, reply) =>
      currentPersistence
        .retrieveAll()
        .then(reply, reply)
  });

  server.start(() => {
    console.log('http://localhost:3000/');
    
  });
}

module.exports = init;