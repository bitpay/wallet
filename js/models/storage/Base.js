'use strict';

var imports = require('soop').imports();

function Storage() {
}

// get value by key
Storage.prototype.get = function(k) {
};

// set value for key
Storage.prototype.set = function(k,v) {
};

// remove value for key
Storage.prototype.remove = function(k) {
};

// remove all values
Storage.prototype.clearAll = function() {
};     

module.exports = require('soop')(Storage);
