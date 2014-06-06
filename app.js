var express = require('express');
var http    = require('http');
var app     = express();

app.start = function(port, callback) {

  app.set('port', port);
  app.use(express.static(__dirname));

  app.listen(port, function() {
    callback('http://localhost:' + port);
  });
};

module.exports = app;

// if we are running in the copay shell context, initialize the shell bindings
if (process.versions && process.versions['atom-shell']) {
  require('./shell')(app);
}
