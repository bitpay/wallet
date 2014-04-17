'use strict';

var imports = require('soop').imports();

function Storage() {
}

// get value by key
Storage.prototype.get = function(walletId,k) {
};

// set value for key
Storage.prototype.set = function(walletId,v) {
};

// remove value for key
Storage.prototype.remove = function(walletId, k) {
};

Storage.prototype.getWalletIds = function() {
};

// remove all values
Storage.prototype.clearAll = function() {
};     

module.exports = require('soop')(Storage);
