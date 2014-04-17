'use strict';

var imports     = require('soop').imports();
var bitcore     = require('bitcore');

function Insight(opts) {
  opts = opts || {};
  this.host = opts.host || 'localhost';
  this.port = opts.port || '3001';
  this.scheme = opts.scheme || 'http';
}

function _asyncForEach(array, fn, callback) {
  array = array.slice(0);
  function processOne() {
    var item = array.pop();
    fn(item, function(result) {
        if(array.length > 0) {
          setTimeout(processOne, 0); // schedule immediately
        } else {
          callback(); // Done!
        }
      });
  }
  if(array.length > 0) {
    setTimeout(processOne, 0); // schedule immediately
  } else {
    callback(); // Done!
  }
}; 

Insight.prototype.listUnspent = function(addresses, cb) {
  var self = this;
  
  if (!addresses || !addresses.length) return cb([]);

  var all = [];

  _asyncForEach(addresses, function(addr, callback) {
    var options = {
      host: self.host,
      port: self.port,
      scheme: self.scheme,
      method: 'GET',
      path: '/api/addr/' + addr + '/utxo',

      headers: { 'Access-Control-Request-Headers' : '' }
    };
    
    self._request(options, function(err, res) {
      if (res && res.length > 0) { 
        all = all.concat(res);
      } 
      callback();
    });
  }, function() {
    return cb(all);
  });
};

Insight.prototype.sendRawTransaction = function(rawtx, cb) {
  if (!rawtx) return callback();

  var options = {
    host: this.host,
    port: this.port,
    method: 'POST',
    path: '/api/tx/send',
    data: 'rawtx='+rawtx,
    headers: { 'content-type' : 'application/x-www-form-urlencoded' }
  };
  this._request(options, function(err,res) {
    if (err) return cb();
    return cb(res.txid);
  });
};

Insight.prototype._request = function(options, callback) {
  if (typeof process === 'undefined' || !process.version) {
    var request = new XMLHttpRequest();

    // TODO: Normalize URL
    var url = 'http://' + options.host;

    if (options.port !== 80) {
      url = url + ':' + options.port;
    }

    url = url + options.path;

    if (options.data && options.method === 'GET') {
      url = url + '?' + options.data;
    }

    request.open(options.method, url, true);
    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 200) {
          try {
            return callback(null, JSON.parse(request.responseText));
          } catch (e) {
            return callback({message: 'Wrong response from insight'});
          }
        } else {
          return callback({message: 'Error ' + response.statusCode});
        }
      }
    };

    if (options.method === 'POST') {
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      request.send(options.data);
    } else {
      request.send(null);
    }
  } else {
    var http = require('http');
    var req = http.request(options, function(response) {
      var ret;
      if (response.statusCode == 200) {
        response.on('data', function(chunk) {
          try {
            ret = JSON.parse(chunk);
          } catch (e) {
            callback({message: "Wrong response from insight"});
            return;
          }
        });
        response.on('end', function () {
          callback(undefined, ret);   
          return;
        });
      }
      else {
        callback({message: 'Error ' + response.statusCode}); 
        return;
      }
    });
    if (options.data) {
      req.write(options.data);
    }
    req.end();
  }
}


module.exports = require('soop')(Insight);

