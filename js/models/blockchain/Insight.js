'use strict';

var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var http        = require('http');

function Insight(opts) {
  opts = opts || {};
  this.host = 'localhost';
  this.port = '3001';
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

Insight.prototype.getBalance = function(unspent) {
  var balance = 0;
  for(var i=0;i<unspent.length; i++) {
    balance = balance + unspent[i].amount;
  }

  return balance;
};

Insight.prototype.listUnspent = function(addresses, cb) {
  var self = this;
  
  if (!addresses || !addresses.length) return cb();

  var all = [];

  _asyncForEach(addresses, function(addr, callback) {
    var options = {
      host: self.host,
      port: self.port,
      method: 'GET',
      path: '/api/addr/' + addr + '/utxo'
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


module.exports = require('soop')(Insight);

