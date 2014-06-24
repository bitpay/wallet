var server = require('./app');
var port = process.env.PORT || 3000;

server.start(port, function(loc) {
  console.log('Listening at: ' + loc);
});
