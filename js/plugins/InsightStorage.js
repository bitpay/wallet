var request = require('request');
var cryptoUtil = require('../util/crypto');
var bitcore = require('bitcore');
var buffers = require('buffer');
var querystring = require('querystring');
var Identity = require('../models/Identity');
var log = require('../util/log');

var SEPARATOR = '|';

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

InsightStorage.prototype.resendVerificationEmail = function (callback) {
  var passphrase = this.getPassphrase();
  var authHeader = new buffers.Buffer(this.email + ':' + passphrase).toString('base64');
  var resendUrl = this.storeUrl + '/resend_email';

  log.debug('Resending verification email: ' + this.email);
  this.request.get({
    url: resendUrl,
    headers: {
      'Authorization': authHeader
    },
    body: null,
  }, function(err, response, body) {
    if (err) {
      return callback('Connection error');
    }
    if (response.statusCode === 409) {
      return callback('BADCREDENTIALS: Invalid username or password');
    } else if (response.statusCode !== 200) {
      return callback('Unable to process the request');
    }
    return callback();
  });
};

function mayBeOldPassword(password) {
  // Test for base64
  return /^[a-zA-Z0-9\/=\+]+$/.test(password);
}

InsightStorage.prototype.getItem = function(name, callback) {
  var passphrase = this.getPassphrase();
  var self = this;

  this._makeGetRequest(passphrase, name, function(err, body, headers) {
    if (err) log.warn(err);
    if (err && err.indexOf('PNOTFOUND') !== -1 && mayBeOldPassword(self.password)) {
      return self._brokenGetItem(name, callback);
    }
    return callback(err, body, headers);
  });
};

/* This key need to have DIFFERENT
 * settings(salt,iterations) than the kdf for wallet/profile encryption
 * in Encrpted*Storage. The user should be able
 * to change the settings on config.js to modify salt / iterations
 * for encryption, but
 * mantain the same key & passphrase. This is why those settings are
 * not shared with encryption
 */
InsightStorage.prototype.getKey = function() {
  if (!this._cachedKey) {
    this._cachedKey = cryptoUtil.kdf(this.password + SEPARATOR + this.email, this.salt, this.iterations);
  }
  return this._cachedKey;
};

InsightStorage.prototype.getPassphrase = function() {
  return bitcore.util.twoSha256(this.getKey()).toString('base64');
};

/**
 * XmlHttpRequest's getAllResponseHeaders() method returns a string of response
 * headers according to the format described here:
 * http://www.w3.org/TR/XMLHttpRequest/#the-getallresponseheaders-method
 * This method parses that string into a user-friendly key/value pair object.
 */
InsightStorage.parseResponseHeaders = function (headerStr) {
  var headers = {};
  if (!headerStr) {
    return headers;
  }
  var headerPairs = headerStr.split('\u000d\u000a');
  for (var i = 0, len = headerPairs.length; i < len; i++) {
    var headerPair = headerPairs[i];
    var index = headerPair.indexOf('\u003a\u0020');
    if (index > 0) {
      var key = headerPair.substring(0, index);
      var val = headerPair.substring(index + 2);
      headers[key] = val;
    }
  }
  return headers;
}

InsightStorage.prototype._makeGetRequest = function(passphrase, key, callback) {
  var authHeader = new buffers.Buffer(this.email + ':' + passphrase).toString('base64');
  var retrieveUrl = this.storeUrl + '/retrieve';
  var getParams = {
    url: retrieveUrl + '?' + querystring.encode({
      key: key, 
      rand: Math.random() // prevent cache
    }),
    headers: {
      'Authorization': authHeader
    }
  };
  this.request.get(getParams,
    function(err, response, body) {
      if (err) {
        return callback('Connection error');
      }
      if (response.statusCode === 403) {
        return callback('PNOTFOUND: Profile not found');
      }
      if (response.statusCode !== 200) {
        return callback('Unable to read item from insight');
      }
      return callback(null, body, InsightStorage.parseResponseHeaders(response.getAllResponseHeaders()));
    }
  );
};

InsightStorage.prototype._brokenGetItem = function(name, callback) {
  var passphrase = this._makeBrokenSecret();
  var self = this;
  log.debug('using legacy get');
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

  log.debug('setItem ' +  name + ' size:'+ (value.length/1024).toFixed(1) + 'kb' );
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
    } else if (response.statusCode === 406) {
      return callback('OVERQUOTA: Quota exceeded');
    } else if (response.statusCode === 501) {
      return callback('EMAILERROR: Error sending verification email');
    } else if (response.statusCode !== 200) {
      return callback('Unable to store data on insight');
    }
    return callback();
  });
};

InsightStorage.prototype.removeItem = function(key, callback) {
  var passphrase = this.getPassphrase();
  var authHeader = new buffers.Buffer(this.email + ':' + passphrase).toString('base64');
  var deleteUrl = this.storeUrl + '/delete/item';
  var getParams = {
    url: deleteUrl + '?' + querystring.encode({
      key: key
    }),
    headers: {
      'Authorization': authHeader
    }
  };
  log.debug('Erasing: ' +  key);
  this.request.get(getParams, function(err, response, body) {
    if (err) {
      return callback('Connection error');
    }
    if (response.statusCode === 409) {
      return callback('BADCREDENTIALS: Invalid username or password');
    } else if (response.statusCode !== 200) {
      return callback('Unable to remove data on insight');
    }
    return callback();
  });
};

InsightStorage.prototype.clear = function(callback) {
  var passphrase = this.getPassphrase();
  var authHeader = new buffers.Buffer(this.email + ':' + passphrase).toString('base64');
  var deleteUrl = this.storeUrl + '/delete/profile';

  log.debug('Clearing storage for: ' + this.email);
  this.request.post({
    url: deleteUrl,
    headers: {
      'Authorization': authHeader
    },
    body: null,
  }, function(err, response, body) {
    if (err) {
      return callback('Connection error');
    }
    if (response.statusCode === 409) {
      return callback('BADCREDENTIALS: Invalid username or password');
    } else if (response.statusCode !== 200) {
      return callback('Unable to remove data on insight');
    }
    return callback();
  });
};

module.exports = InsightStorage;
