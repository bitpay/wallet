'use strict';

var imports = require('soop').imports();
var bitcore = require('bitcore');

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
      if (array.length > 0) {
        setTimeout(processOne, 0); // schedule immediately
      } else {
        callback(); // Done!
      }
    });
  }
  if (array.length > 0) {
    setTimeout(processOne, 0); // schedule immediately
  } else {
    callback(); // Done!
  }
};

function removeRepeatedElements(ar) {
  var ya = false,
    v = "",
    aux = [].concat(ar),
    r = Array();
  for (var i in aux) { // 
    v = aux[i];
    ya = false;
    for (var a in aux) {
      if (v == aux[a]) {
        if (ya == false) {
          ya = true;
        } else {
          aux[a] = "";
        }
      }
    }
  }
  for (var a in aux) {
    if (aux[a] != "") {
      r.push(aux[a]);
    }
  }
  return r;
}

Insight.prototype.getTransactions = function(addresses, cb) {
  var self = this;

  if (!addresses || !addresses.length) return cb([]);

  var txids = [];
  var txs = [];

  _asyncForEach(addresses, function(addr, callback) {
    var options = {
      host: self.host,
      port: self.port,
      scheme: self.scheme,
      method: 'GET',
      path: '/api/addr/' + addr,
      headers: {
        'Access-Control-Request-Headers': ''
      }
    };

    self._request(options, function(err, res) {
      var txids_tmp = res.transactions;
      for (var i = 0; i < txids_tmp.length; i++) {
        txids.push(txids_tmp[i]);
      }
      callback();
    });
  }, function() {
    var clean_txids = removeRepeatedElements(txids);
    _asyncForEach(clean_txids, function(txid, callback2) {
      var options = {
        host: self.host,
        port: self.port,
        scheme: self.scheme,
        method: 'GET',
        path: '/api/tx/' + txid,
        headers: {
          'Access-Control-Request-Headers': ''
        }
      };
      self._request(options, function(err, res) {
        txs.push(res);
        callback2();
      });
    }, function() {
      return cb(txs);
    });
  });
};

Insight.prototype.getUnspent = function(addresses, cb) {
  if (!addresses || !addresses.length) return cb(null, []);

  var all = [];

  var options = {
    host: this.host,
    port: this.port,
    scheme: this.scheme,
    method: 'POST',
    data: 'addrs=' + addresses.join(','),
    path: '/api/addrs/utxo',
    headers: {
      'Access-Control-Request-Headers': ''
    }
  };

  this._request(options, function(err, res) {
    if (err) {
      return cb(err);
    }

    if (res && res.length > 0) {
      all = all.concat(res);
    }

    return cb(null, all);
  });
};

Insight.prototype.sendRawTransaction = function(rawtx, cb) {
  if (!rawtx) return callback();

  var options = {
    host: this.host,
    port: this.port,
    method: 'POST',
    path: '/api/tx/send',
    data: 'rawtx=' + rawtx,
    headers: {
      'Access-Control-Request-Headers': ''
    }
  };
  this._request(options, function(err, res) {
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
    request.timeout = 10000;
    request.ontimeout = function() {
      return callback({
        message: 'Insight request timeout. Please check your Insight settings or the Insight server status.'
      });
    };

    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 200 || request.status === 304 || request.status === 0) {
          try {
            var ret = JSON.parse(request.responseText);
            return callback(null, ret);
          } catch (e) {
            return callback({
              message: 'Wrong response from insight'
            });
          }
        } else {
          return callback({
            message: 'Error code: ' + request.status + ' - Status: ' + request.statusText + ' - Description: ' + request.responseText
          });
        }
      }
    };

    if (options.method === 'POST') {
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }

    request.send(options.data || null);
  } else {
    var http = require('http');
    var req = http.request(options, function(response) {
      var ret;
      if (response.statusCode == 200 || response.status === 304) {
        response.on('data', function(chunk) {
          try {
            ret = JSON.parse(chunk);
          } catch (e) {
            return callback({
              message: 'Wrong response from insight'
            });
          }
        });
        response.on('end', function() {
          return callback(null, ret);
        });
      } else {
        return callback({
          message: 'Error ' + response.statusCode
        });
      }
    });

    if (options.data) {
      req.write(options.data);
    }

    req.end();
  }
};

module.exports = require('soop')(Insight);
