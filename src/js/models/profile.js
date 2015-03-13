'use strict';

function Profile() {
  this.version = '1.0.0';
};

Profile.create = function(opts) {
  opts = opts || {};
  //  $.checkArgument(opts.createdOn, 'Missing ');

  var x = new Profile();
  x.createdOn = Date.now();
  x.credentials = opts.credentials;
  return x;
};


Profile.fromObj = function(obj) {
  var x = new Profile();
  x.createdOn = obj.createdOn;
  x.credentials = obj.credentials;
  return x;
};


Profile.fromString = function(str) {
  return Profile.fromObj(JSON.parse(str));
};

Profile.prototype.toObj = function() {
  return JSON.stringify(this);
};
