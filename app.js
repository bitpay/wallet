var express = require('express');
var http = require('http');
var app = express();

app.use('/', express.static(__dirname + '/'));
app.get('*', function(req, res) {
  return res.sendfile('index.html');
});

app.start = function(port, callback) {

  app.set('port', port);
  app.use(express.static(__dirname));

  if (process.env.USE_HTTPS) {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    var fs = require('fs');
    var path = require('path');
    var bc = path.dirname(require.resolve('bitcore/package.json'));
    var server = require('https').createServer({
      key: fs.readFileSync(bc + '/test/data/x509.key'),
      cert: fs.readFileSync(bc + '/test/data/x509.crt')
    });
    var pserver = require(bc + '/examples/PayPro/server.js');
    server.on('request', function(req, res) {
      app(req, res);
      pserver.app(res, res);
    });
    app.listen(port, function() {
      callback('https://localhost:' + port);
    });
    return;
  }

  app.listen(port, function() {
    callback('http://localhost:' + port);
  });
};

module.exports = app;

// if we are running in the copay shell context, initialize the shell bindings
if (process.versions && process.versions['atom-shell']) {
  require('./shell')(app);
}
