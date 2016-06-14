'use strict';

/**
 * Profile
 *
 * credential: array of OBJECTS
 */
function Profile() {
  this.version = '1.0.0';
};

Profile.create = function(opts) {
  opts = opts || {};

  var x = new Profile();
  x.createdOn = Date.now();
  x.credentials = opts.credentials || [];
  x.disclaimerAccepted = false;
  x.checked = {};
  return x;
};

Profile.fromObj = function(obj) {
  var x = new Profile();

  x.createdOn = obj.createdOn;
  x.credentials = obj.credentials;
  x.disclaimerAccepted = obj.disclaimerAccepted;
  x.checked = obj.checked || {};
  x.checkedUA = obj.checkedUA || {};

  if (x.credentials[0] && typeof x.credentials[0] != 'object')
    throw ("credentials should be an object");

  return x;
};

Profile.fromString = function(str) {
  return Profile.fromObj(JSON.parse(str));
};

Profile.prototype.toObj = function() {
  delete this.dirty;
  return JSON.stringify(this);
};


Profile.prototype.hasWallet = function(walletId) {
  for (var i in this.credentials) {
    var c = this.credentials[i];
    if (c.walletId == walletId) return true;
  };
  return false;
};

Profile.prototype.isChecked = function(ua, walletId) {
  return !!(this.checkedUA == ua && this.checked[walletId]);
};


Profile.prototype.isDeviceChecked = function(ua) {
  return this.checkedUA == ua;
};


Profile.prototype.setChecked = function(ua, walletId) {
  if (this.checkedUA != ua) {
    this.checkedUA = ua;
    this.checked = {};
  }
  this.checked[walletId] = true;
  this.dirty = true;
};


Profile.prototype.addWallet = function(credentials) {
  if (!credentials.walletId)
    throw 'credentials must have .walletId';

  if (this.hasWallet(credentials.walletId))
    return false;

  this.credentials.push(credentials);
  this.dirty = true;
  return true;
};

Profile.prototype.updateWallet = function(credentials) {
  if (!credentials.walletId)
    throw 'credentials must have .walletId';

  if (!this.hasWallet(credentials.walletId))
    return false;

  this.credentials = this.credentials.map(function(c) {
    if(c.walletId != credentials.walletId ) {
      return c;
    } else {
      return credentials
    }
  });

  this.dirty = true;
  return true;
};

Profile.prototype.deleteWallet = function(walletId) {
  if (!this.hasWallet(walletId))
    return false;

  this.credentials = this.credentials.filter(function(c) {
    return c.walletId != walletId;
  });

  this.dirty = true;
  return true;
};
