'use strict';

function GoogleDrive() {
  this.type = 'STORAGE';
};

GoogleDrive.prototype.init = function() {
  console.log('[googleDrive.js.3] init GoogleDrive'); //TODO
};


GoogleDrive.prototype.getItem = function(k) {
  return localStorage.getItem(k);
};

GoogleDrive.prototype.setItem = function(k,v) {
  localStorage.setItem(k,v);
};

GoogleDrive.prototype.removeItem = function(k) { 
  localStorage.removeItem(k);
};

GoogleDrive.prototype.clear = function() { 
  localStorage.clear();
};

delete GoogleDrive.prototype.length;

Object.defineProperty(GoogleDrive.prototype, 'length', {
  get: function() {
    return localStorage.length;
  }
});

GoogleDrive.prototype.key = function(k) {
  var v = localStorage.key(k);
  return v;
};


module.exports = GoogleDrive;
