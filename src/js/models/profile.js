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

  if (x.credentials[0] && typeof x.credentials[0] != 'object')
    throw ("credentials should be an object");

  return x;
};

Profile.fromString = function(str) {
  return Profile.fromObj(JSON.parse(str));
};

Profile.prototype.toObj = function() {
  return JSON.stringify(this);
};
