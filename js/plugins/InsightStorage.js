var request = require('request');
var cryptoUtil = require('../util/crypto');
var buffers = require('buffer');
var querystring = require('querystring');
var Identity = require('../models/Identity');

var SEPARATOR = '|';
var BODY = 'IR7GCUVgaLGe4LCtXjtUo4hsH8BO67jIrBKCeFiYOQ7CKWVPx3FshqTM';

function InsightStorage(config) {
  this.type = 'DB';
  this.storeUrl = config.url || 'https://insight.bitpay.com:443/api/email',
  this.request = config.request || request;

  this.iterations = config.iterations || 1000;
  this.salt = config.salt || 'jBbYTj8zTrOt6V';
}

InsightStorage.prototype.init = function() {};

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

/* This key has not need to have the same
 * settings(salt,iterations) as the kdf for wallet/profile encryption
 * in Encrpted*Storage. And, actually, it good for the user to be able
 * to change the settings con config.js to modify salt / iterations but
 * mantain the same key & passphrase. This is why those settings are 
 * not shared.
 */
InsightStorage.prototype.getKey = function() {
  if (!this._cachedKey) {
    this._cachedKey = cryptoUtil.kdf(this.password + SEPARATOR + this.email, this.salt, this.iterations);
  }
  return this._cachedKey;
};

InsightStorage.prototype.getPassphrase = function() {
  return cryptoUtil.hmac(this.getKey(), BODY);
};

InsightStorage.prototype._makeGetRequest = function(passphrase, key, callback) {
  var authHeader = new buffers.Buffer(this.email + ':' + passphrase).toString('base64');
  var retrieveUrl = this.storeUrl + '/retrieve';
  this.request.get({
      url: retrieveUrl + '?' + querystring.encode({
        key: key
      }),
      headers: {
        'Authorization': authHeader
      }
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

InsightStorage.prototype._makeBrokenSecret = function() {
  var key = cryptoUtil.kdf(this.password + this.email, 'mjuBtGybi/4=', 100);
  return cryptoUtil.kdf(key, this.password, 100);
};

InsightStorage.prototype._changePassphrase = function(callback) {
  var passphrase = this._makeBrokenSecret();
  var newPassphrase = this.getPassphrase();
  var authHeader = new buffers.Buffer(this.email + ':' + passphrase).toString('base64');

  var url = this.storeUrl + '/change_passphrase';
  this.request.post({
    url: url,
    headers: {
      'Authorization': authHeader
    },
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
  var registerUrl = this.storeUrl + '/save';
  this.request.post({
    url: registerUrl,
    headers: {
      'Authorization': authHeader
    },
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
