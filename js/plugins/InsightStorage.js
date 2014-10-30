var request = require('request');
var cryptoUtil = require('../util/crypto');
var querystring = require('querystring');
var Identity = require('../models/Identity');

function InsightStorage(config) {
  this.type = 'DB';
  this.storeUrl = config.url || 'https://insight.is/api/email';
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

InsightStorage.prototype.getItem = function(name, callback) {
  var key = cryptoUtil.kdf(this.password + this.email);
  var secret = cryptoUtil.kdf(key, this.password);
  var encodedEmail = encodeURIComponent(this.email);
  var retrieveUrl = this.storeUrl + '/retrieve/' + encodedEmail;
  this.request.get(retrieveUrl + '?' + querystring.encode({secret: secret, key: name}),
    function(err, response, body) {
      if (err) {
        return callback('Connection error');
      }
      if (response.statusCode !== 200) {
        return callback('Connection error');
      }
      return callback(null, body);
    }
  );
};

InsightStorage.prototype.setItem = function(name, value, callback) {
  var key = cryptoUtil.kdf(this.password + this.email);
  var secret = cryptoUtil.kdf(key, this.password);
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
