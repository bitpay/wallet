var request = require('request');
var cryptoUtil = require('../util/crypto');
var buffers = require('buffer');
var querystring = require('querystring');
var Identity = require('../models/Identity');

function InsightStorage(config) {
  this.type = 'DB';
  this.storeUrl = config.url || 'https://test-insight.bitpay.com:443/api/email';
  this.request = config.request || request;
}

InsightStorage.prototype.init = function () {};

InsightStorage.prototype.setCredentials = function(email, password, opts) {
  this.email = email;
  this.password = password;
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
  var key = cryptoUtil.kdf(this.password + this.email);
  var secret = this.makeSecret(key);
  var self = this;

  this._makeGetRequest(secret, name, function(err, body) {
    if (err && err.indexOf('PNOTFOUND') !== -1 && mayBeOldPassword(self.password)) {
      return self._brokenGetItem(key, name, callback);
    }
    return callback(err, body);
  });
};

InsightStorage.prototype.makeSecret = function(key) {
  return cryptoUtil.kdf(key + this.password);
};

InsightStorage.prototype._makeGetRequest = function(secret, key, callback) {
  var authHeader = new Buffer(this.email + ':' + secret).toString('base64');
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

InsightStorage.prototype._brokenGetItem = function(key, name, callback) {
  var secret = this._makeBrokenSecret(key);
  var self = this;
  this._makeGetRequest(secret, name, function(err, body) {
    if (!err) {
      return self._changePassword(function(err) {
        if (err) {
          return callback(err);
        }
        return callback(null, body);
      });
    }
    return callback(err);
  });
};

InsightStorage.prototype._makeBrokenSecret = function(key) {
  return cryptoUtil.kdf(key, this.password);
};

InsightStorage.prototype._changePassword = function(callback) {
  var key = cryptoUtil.kdf(this.password + this.email);
  var secret = this._makeBrokenSecret(key);
  var newSecret = this.makeSecret(key);

  var url = this.storeUrl + '/change_passphrase';
  this.request.post({
    url: url,
    body: querystring.encode({
      email: this.email,
      secret: secret,
      newSecret: newSecret
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
  var key = cryptoUtil.kdf(this.password + this.email);
  var secret = this.makeSecret(key);
  var registerUrl = this.storeUrl + '/register';
  this.request.post({
    url: registerUrl,
    body: querystring.encode({
      key: name,
      email: this.email,
      secret: secret,
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
