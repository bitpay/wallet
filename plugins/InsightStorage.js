var request = require('request');
var cryptoUtil = require('../js/util/crypto');
var querystring = require('querystring');
var Identity = require('../js/models/Identity');

function InsightStorage(config) {
  this.type = 'remote-backup';
  this.storeUrl = config.url || 'https://insight.is/api/email';
  this.request = config.request || request;
}

InsightStorage.prototype.init = function () {};

InsightStorage.prototype.retrieve = function(email, password, opts, callback) {
  var key = cryptoUtil.kdf(password, email);
  var secret = cryptoUtil.kdf(key, password);
  var encodedEmail = encodeURIComponent(email);
  var retrieveUrl = this.storeUrl + '/retrieve/' + encodedEmail;
  this.request.get(retrieveUrl + '?' + querystring.encode({secret: secret}),
    function(err, response, body) {
      if (err) {
        return callback('Connection error');
      }
      if (response.statusCode !== 200) {
        return callback('Connection error');
      }
      var decryptedJson = cryptoUtil.decrypt(key, body);
      if (!decryptedJson) {
        return callback('Internal Error');
      }
      return Identity.importFromJson(decryptedJson, password, opts, callback);
    }
  );
};

InsightStorage.prototype.store = function(identity, opts, callback) {
  var password = identity.profile.password;
  var key = cryptoUtil.kdf(password, identity.profile.email);
  var secret = cryptoUtil.kdf(key, password);
  var record = cryptoUtil.encrypt(key, identity.exportAsJson());
  var registerUrl = this.storeUrl + '/register';
  this.request.post({
    url: registerUrl,
    body: querystring.encode({
      email: identity.profile.email,
      secret: secret,
      record: record
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

module.exports = InsightStorage;
