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
    var path = require('path');
    var bc = path.dirname(require.resolve('bitcore/package.json'));
    // var fs = require('fs');
    // var server = require('https').createServer({
    //   key: fs.readFileSync(bc + '/test/data/x509.key'),
    //   cert: fs.readFileSync(bc + '/test/data/x509.crt')
    // });
    var pserver = require(bc + '/examples/PayPro/server.js');
    pserver.removeListener('request', pserver.app);
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

// if we are running in the copay shell context, initialize the shell bindings
if (process.versions && process.versions['atom-shell']) {
  require('./shell')(app);
}
