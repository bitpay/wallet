'use strict';

var imports = require('soop').imports();

function Storage() {
}

// get value by key
Storage.prototype.get = function(walletId,k) {
};

// set value for key
Storage.prototype.set = function(walletId, k, v) {
};

// remove value for key
Storage.prototype.remove = function(walletId, k) {
};

Storage.prototype.getWalletIds = function() {
};

// obj contains keys to be set
Storage.prototype.setFromObj = function(walletId, obj) {
};

Storage.prototype.setFromEncryptedObj = function(walletId, obj) {
};

// wallet export - hex of encrypted wallet object
Storage.prototype.getEncryptedObj = function(walletId) {
};

// remove all values
Storage.prototype.clearAll = function() {
};     

module.exports = require('soop')(Storage);
