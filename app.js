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
