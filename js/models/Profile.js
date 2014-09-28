'use strict';
var preconditions = require('preconditions').singleton();
var _ = require('underscore');
var log = require('../log');
var bitcore = require('bitcore');

function Profile(info, password, storage) {
  preconditions.checkArgument(info.email);
  preconditions.checkArgument(password);
  preconditions.checkArgument(storage);
  preconditions.checkArgument(storage.getItem);

  this.email  = info.email;
  this.extra = info.extra;
  this.hash = bitcore.util.sha256ripe160(this.email + this.password).toString('hex');
  this.storage = storage;
};

Profile.fromObj = function(obj, password, storage) {
  var o = _.clone(obj);
  return new Profile(obj, password, storage);
};

Profile.prototype.toObj = function() {
  var obj = _.clone(this);
  delete obj['hash'];
  return JSON.parse(JSON.stringify(obj));
};


Profile.prototype.store = function(cb) {
  var val  = this.toObj();
  var key = 'identity::' + this.hash + '_' + this.email;

  this.storage.setFromObj(key, val, function(err) {
    log.debug('Identity stored');
    if (cb)
      cb(err);
  });
};

module.exports = Profile;
 
