var cryptoUtil = require('../util/crypto');
var log = require('../util/log');
var LocalStorage = require('./LocalStorage');
var inherits = require('inherits');

var SEPARATOR = '@#$';

function EncryptedLocalStorage(config) {
  LocalStorage.apply(this, [config]);
}
inherits(EncryptedLocalStorage, LocalStorage);


EncryptedLocalStorage.prototype._brokenDecrypt = function(body) {
  var key = cryptoUtil.kdf(this.password + this.email, 'mjuBtGybi/4=', 100);
  log.debug('Trying legacy decrypt')
  var decryptedJson = cryptoUtil.decrypt(key, body);
  return decryptedJson;
};



EncryptedLocalStorage.prototype._brokenDecryptUndef = function(body) {
  var badkey = undefined + SEPARATOR + undefined;
  return cryptoUtil.decrypt(badkey, body);
};




EncryptedLocalStorage.prototype.getItem = function(name, callback) {
  var self = this;
  LocalStorage.prototype.getItem.apply(this, [name,
    function(err, body) {
      var decryptedJson = cryptoUtil.decrypt(self.email + SEPARATOR + self.password, body);
      if (!decryptedJson) {
        log.debug('Could not decrypt value using current decryption schema');
        decryptedJson = self._brokenDecrypt(body);
      }

      if (!decryptedJson) {
        decryptedJson = self._brokenDecryptUndef(body);
      }

      if (!decryptedJson) {
        log.debug('Could not decrypt value.');
        return callback('PNOTFOUND');
      }

      return callback(null, decryptedJson);
    }
  ]);
};

EncryptedLocalStorage.prototype.setItem = function(name, value, callback) {
  if (!_.isString(value)) {
    value = JSON.stringify(value);
  }
  var record = cryptoUtil.encrypt(this.email + SEPARATOR + this.password, value);
  LocalStorage.prototype.setItem.apply(this, [name, record, callback]);
};

EncryptedLocalStorage.prototype.removeItem = function(name, callback) {
  LocalStorage.prototype.removeItem.apply(this, [name, callback]);
};

EncryptedLocalStorage.prototype.clear = function(callback) {
  LocalStorage.prototype.clear.apply(this, [callback]);
};


module.exports = EncryptedLocalStorage;
