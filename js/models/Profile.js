'use strict';
var preconditions = require('preconditions').singleton();
var _ = require('underscore');
var log = require('../log');
var bitcore = require('bitcore');

function Profile(opts, storage) {
  preconditions.checkArgument(opts.email);
  preconditions.checkArgument(opts.password);
  preconditions.checkArgument(storage);
  preconditions.checkArgument(storage.getItem);

  this.email  = opts.email;
  this.password = opts.password;
  this.hash = bitcore.util.sha256ripe160(this.email + this.password);

  this.extra = opts.extra;
};

Profile.fromObj = function(obj, storage) {
  return new Profile(obj, storage);
};

Profile.prototype.toObj = function() {
  return JSON.parse(JSON.stringify(this));
};


Profile.prototype.store = function(cb) {
// TODO
  return cb();
//  this.storage.setItem(this.hash, this.toObj());
};



module.exports = Profile;
 
