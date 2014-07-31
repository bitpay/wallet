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
    pserver.removeListener('request', pserver.app);
    pserver.on('request', function(req, res) {
      var statusCode = res.statusCode;

      var headers = Object.keys(res._headers || {}).reduce(function(out, key) {
        out[key] = res._headers[key];
        return out;
      }, {});

      var headerNames = Object.keys(res._headerNames || {}).reduce(function(out, key) {
        out[key] = res._headerNames[key];
        return out;
      }, {});

      var writeHead = res.writeHead;
      var write = res.write;
      var end = res.end;
      var status;

      res.writeHead = function(s) {
        status = s;
        if (status > 400) {
          return;
        }
        return writeHead.apply(this, arguments);
      };

      res.write = function() {
        if (status && status > 400) {
          return true;
        }
        return write.apply(this, arguments);
      };

      res.end = function() {
        var self = this;
        var args = Array.prototype.slice.call(arguments);
        process.nextTick(function() {
          self.statusCode = statusCode;
          self._headers = headers;
          self._headerNames = headerNames;
          self.writeHead = writeHead;
          self.write = write;
          self.end = end;
          if ((status || self.statusCode) > 400) {
            return pserver.app(req, res);
          }
          return end.apply(self, args);
        });
        return true;
      };

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
