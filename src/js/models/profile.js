'use strict';

function Profile() {
  this.version = '1.0.0';
};

Profile.create = function(opts) {
  opts = opts || {};
  //  $.checkArgument(opts.createdOn, 'Missing ');

  var x = new Profile();
  x.createdOn = Date.now();
  x.lastFocusedWalletId = opts.lastFocusedWalletId;
  x.credentials = opts.credentials;
  return x;
};


Profile.prototype.toObj = function() {
  return JSON.stringify(this);
};

Profile.prototype.fromObj = function(obj) {
  var x = new Profile();
  x.createdOn = obj.createdOn;
  x.lastFocusedWalletId = obj.lastFocusedWalletId;
  x.credentials = obj.credentials;
  return x;
};
