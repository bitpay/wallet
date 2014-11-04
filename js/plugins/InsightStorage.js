var request = require('request');
var cryptoUtil = require('../util/crypto');
var buffers = require('buffer');
var querystring = require('querystring');
var Identity = require('../models/Identity');

var SEPARATOR = '|';

function InsightStorage(config) {
  this.type = 'DB';
  this.storeUrl = config.url || 'https://test-insight.bitpay.com:443/api/email';
  this.request = config.request || request;
}

InsightStorage.prototype.init = function () {};

InsightStorage.prototype.setCredentials = function(email, password, opts) {
  this.email = email;
  this.password = password;
  this._cachedKey = null;
};

InsightStorage.prototype.createItem = function(name, value, callback) {
  var self = this;

  this.getItem(name, function(err, retrieved) {
    if (err || !retrieved) {
      return self.setItem(name, value, callback);
    } else {
      return callback('EEXISTS');
    }
  });
};

function mayBeOldPassword(password) {
  // Test for base64
  return /^[a-zA-Z0-9\/=\+]+$/.test(password);
}

InsightStorage.prototype.getItem = function(name, callback) {
  var passphrase = this.getPassphrase();
  var self = this;

  this._makeGetRequest(passphrase, name, function(err, body) {
    if (err && err.indexOf('PNOTFOUND') !== -1 && mayBeOldPassword(self.password)) {
      return self._brokenGetItem(name, callback);
    }
    return callback(err, body);
  });
};

InsightStorage.prototype.getPassphrase = function() {
  return cryptoUtil.hmac(this.getKey(), this.password);
};

InsightStorage.prototype._makeGetRequest = function(passphrase, key, callback) {
  var authHeader = new buffers.Buffer(this.email + ':' + passphrase).toString('base64');
  var retrieveUrl = this.storeUrl + '/retrieve';
  this.request.get({
      url: retrieveUrl + '?' + querystring.encode({key: key}),
      headers: {'Authorization': authHeader}
    },
    function(err, response, body) {
      if (err) {
        return callback('Connection error');
      }
      if (response.statusCode === 403) {
        return callback('PNOTFOUND: Profile not found');
      }
      if (response.statusCode !== 200) {
        return callback('Connection error');
      }
      return callback(null, body);
    }
  );
};

InsightStorage.prototype._brokenGetItem = function(name, callback) {
  var passphrase = this._makeBrokenSecret();
  var self = this;
  this._makeGetRequest(passphrase, name, function(err, body) {
    if (!err) {
      return self._changePassphrase(function(err) {
        if (err) {
          return callback(err);
        }
        return callback(null, body);
      });
    }
    return callback(err);
  });
};

InsightStorage.prototype.getKey = function() {
  if (!this._cachedKey) {
    this._cachedKey = cryptoUtil.kdf(this.password + SEPARATOR + this.email);
  }
  return this._cachedKey;
};

InsightStorage.prototype._makeBrokenSecret = function() {
  var key = cryptoUtil.kdf(this.password + this.email);
  return cryptoUtil.kdf(key, this.password);
};

InsightStorage.prototype._changePassphrase = function(callback) {
  var passphrase = this._makeBrokenSecret();
  var newPassphrase = this.getPassphrase();
  var authHeader = new buffers.Buffer(this.email + ':' + passphrase).toString('base64');

  var url = this.storeUrl + '/change_passphrase';
  this.request.post({
    url: url,
    headers: {'Authorization': authHeader},
    body: querystring.encode({
      newPassphrase: newPassphrase
    })
  }, function(err, response, body) {
    if (err) {
      return callback('Connection error');
    }
    if (response.statusCode === 409) {
      return callback('BADCREDENTIALS: Invalid username or password');
    }
    if (response.statusCode !== 200) {
      return callback('Unable to store data on insight');
    }
    return callback();
  });
};

InsightStorage.prototype.setItem = function(name, value, callback) {
  var passphrase = this.getPassphrase();
  var authHeader = new buffers.Buffer(this.email + ':' + passphrase).toString('base64');
  var registerUrl = this.storeUrl + '/register';
  this.request.post({
    url: registerUrl,
    headers: {'Authorization': authHeader},
    body: querystring.encode({
      key: name,
      record: value
    })
  }, function(err, response, body) {
    if (err) {
      return callback('Connection error');
    }
    if (response.statusCode === 409) {
      return callback('BADCREDENTIALS: Invalid username or password');
    }
    if (response.statusCode !== 200) {
      return callback('Unable to store data on insight');
    }
    return callback();
  });
};

InsightStorage.prototype.removeItem = function(name, callback) {
  this.setItem(name, '', callback);
};

InsightStorage.prototype.clear = function(callback) {
  // NOOP
  callback();
};

InsightStorage.prototype.allKeys = function(callback) {
  // TODO: compatibility with localStorage
  return callback(null);
};

InsightStorage.prototype.getFirst = function(prefix, opts, callback) {
  // TODO: compatibility with localStorage
  return callback(null, true, true);
};

module.exports = InsightStorage;
