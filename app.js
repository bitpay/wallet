var express = require('express');
var http = require('http');
var app = express();
var request = require('request');

app.use('/', express.static(__dirname + '/'));
app.get('*', function(req, res) {
  return res.sendfile('index.html');
});

app.start = function(port, callback) {

  app.set('port', port);
  app.use(express.static(__dirname));

  // XHR'ing from a site with a self-signed
  // cert on the same port seems to work.
  if (process.env.USE_HTTPS) {
    var path = require('path');

    var bc = path.dirname(require.resolve('bitcore/package.json'));
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

  if (process.env.USE_REQUEST_PROXY) {
    // Disable strict SSL
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

    // NOTE: Should be .use(), but the router is invoked
    // to early above, which puts it on the stack.
    // Only allow proxy requests from localhost
    app.post('/_request', function(req, res, next) {
      var address = req.socket.remoteAddress;
      if (address !== '127.0.0.1' && address !== '::1') {
        res.statusCode = 403;
        res.end();
        return;
      }
      return next();
    });

    // NOTE: Should be .use(), but the router is invoked
    // to early above, which puts it on the stack.
    app.post('/_request', function(req, res, next) {
      var buf = '';

      req.setEncoding('utf8');

      req.on('error', function(err) {
        try {
          req.socket.destroy();
        } catch (e) {
          ;
        }
      });

      req.on('data', function(data) {
        buf += data;
      });

      req.on('end', function(data) {
        if (data) buf += data;
        try {
          req.reqOptions = JSON.parse(buf);
        } catch (e) {
          req.reqOptions = {};
        }
        return next();
      })
    });

    app.post('/_request', function(req, res, next) {
      var options = req.reqOptions;
      if (options.body) {
        options.body = new Buffer(options.body, 'hex');
      }
      request(options, function(err, response, body) {
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(err.stack + '');
          return;
        }
        res.writeHead(response.statusCode, response.headers);
        res.end(body);
      });
    });
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
