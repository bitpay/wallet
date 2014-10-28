var cryptoUtil = require('../util/crypto');
var LocalStorage = require('./LocalStorage');
var inherits = require('inherits');

function EncryptedLocalStorage(config) {
  LocalStorage.apply(this, [config]);
}
inherits(EncryptedLocalStorage, LocalStorage);

EncryptedLocalStorage.prototype.getItem = function(name, callback) {
  var key = cryptoUtil.kdf(this.password + this.email);
  LocalStorage.prototype.getItem.apply(this, [name, function(err, body) {
    var decryptedJson = cryptoUtil.decrypt(key, body);
    if (!decryptedJson) {
      return callback('Internal Error');
    }
    return callback(null, decryptedJson);
  }]);
};

EncryptedLocalStorage.prototype.setItem = function(name, value, callback) {
  var key = cryptoUtil.kdf(this.password + this.email);
  if (!_.isString(value)) {
    value = JSON.stringify(value);
  }
  var record = cryptoUtil.encrypt(key, value);
  LocalStorage.prototype.setItem.apply(this, [name, record, callback]);
};

module.exports = EncryptedLocalStorage;
