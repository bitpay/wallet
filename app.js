var express = require('express');
var http = require('http');
var app = express();

// This is not really necesarry, just to simulate 
// Content Security Policy from Google Chrome Apps.
//
// app.use(function(req, res, next){
//     res.header("Content-Security-Policy", "script-src 'self';object-src 'none';media-src 'self';frame-src 'none';font-src 'self' data:");
//     next();
// });

app.use('/', express.static(__dirname + '/'));
app.get('*', function(req, res) {
  return res.sendFile(__dirname + '/' + 'index.html');
});

app.start = function(port, callback) {

  app.set('port', port);
  app.use(express.static(__dirname));

  if (process.env.USE_HTTPS) {
    var path = require('path');

    var bc = path.dirname(require.resolve('bitcore/package.json'));
    var pserver = require(bc + '/examples/PayPro/server.js');

    pserver.removeListener('request', pserver.app);

    // pserver.options['no-tx'] = true;
    // pserver.options['discovery'] = true;

    pserver.on('request', function(req, res) {
      if (req.url.indexOf('/-/') === 0) {
        return pserver.app(req, res);
      }
      return app(req, res);
    });

    pserver.listen(port, function() {
      callback('https://localhost:' + port);
    });

    return;
  }

  app.listen(port, function() {
    callback('http://localhost:' + port);
  });
};

module.exports = app;

