var cryptoUtil = require('../util/crypto');
var InsightStorage = require('./InsightStorage');
var inherits = require('inherits');

function EncryptedInsightStorage(config) {
  InsightStorage.apply(this, [config]);
}
inherits(EncryptedInsightStorage, InsightStorage);

EncryptedInsightStorage.prototype.getItem = function(name, callback) {
  var key = cryptoUtil.kdf(this.password + this.email);
  InsightStorage.prototype.getItem.apply(this, [name,
    function(err, body) {
      var decryptedJson = cryptoUtil.decrypt(key, body);
      if (!decryptedJson) {
        return callback('Internal Error');
      }
      return callback(null, decryptedJson);
    }
  ]);
};

EncryptedInsightStorage.prototype.setItem = function(name, value, callback) {
  var key = cryptoUtil.kdf(this.password + this.email);
  var record = cryptoUtil.encrypt(key, value);
  InsightStorage.prototype.setItem.apply(this, [name, record, callback]);
};

EncryptedInsightStorage.prototype.removeItem = function(name, callback) {
  var key = cryptoUtil.kdf(this.password + this.email);
  InsightStorage.prototype.removeItem.apply(this, [name, callback]);
};

module.exports = EncryptedInsightStorage;
