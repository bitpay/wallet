var cryptoUtil = require('../util/crypto');
var InsightStorage = require('./InsightStorage');
var inherits = require('inherits');
var log = require('../util/log');
var SEPARATOR = '%^#@';

function EncryptedInsightStorage(config) {
  InsightStorage.apply(this, [config]);
}
inherits(EncryptedInsightStorage, InsightStorage);

EncryptedInsightStorage.prototype._brokenDecrypt = function(body) {
  var key = cryptoUtil.kdf(this.password + this.email, 'mjuBtGybi/4=', 100);
  log.debug('Trying legacy decrypt')
  var decryptedJson = cryptoUtil.decrypt(key, body);
  return decryptedJson;
};

EncryptedInsightStorage.prototype.getItem = function(name, callback) {
  var self = this;
  InsightStorage.prototype.getItem.apply(this, [name,
    function(err, body, headers) {
      if (err) {
        return callback(err);
      }
      var decryptedJson = cryptoUtil.decrypt(self.email + SEPARATOR + self.password, body);

      if (!decryptedJson) {
        log.debug('Could not decrypt value using current decryption schema');
        decryptedJson = self._brokenDecrypt(body);
      }

      if (!decryptedJson) {
        log.debug('Could not decrypt value.');
        return callback('PNOTFOUND');
      }
      return callback(null, decryptedJson, headers);
    }
  ]);
};

EncryptedInsightStorage.prototype.setItem = function(name, value, callback) {
  var record = cryptoUtil.encrypt(this.email + SEPARATOR + this.password, value);
  InsightStorage.prototype.setItem.apply(this, [name, record, callback]);
};

EncryptedInsightStorage.prototype.removeItem = function(name, callback) {
  InsightStorage.prototype.removeItem.apply(this, [name, callback]);
};

EncryptedInsightStorage.prototype.clear = function(callback) {
  InsightStorage.prototype.clear.apply(this, [callback]);
};

module.exports = EncryptedInsightStorage;
