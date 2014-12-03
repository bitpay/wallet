'use strict';
var _ = require('lodash');
var preconditions = require('preconditions').singleton();

function LocalStorage(opts) {
  this.type = 'DB';
  opts = opts || {};
  

  this.ls = opts.ls 
    || ( (typeof localStorage !== 'undefined') ? localStorage : null );

  preconditions.checkState(this.ls,
    'localstorage not available, cannot run plugin');
};

LocalStorage.prototype.init = function() {
};

LocalStorage.prototype.setCredentials = function(email, password, opts) {
  // NOP
};

LocalStorage.prototype.getItem = function(k,cb) {
  preconditions.checkArgument(_.isFunction(cb));
  return cb(null, this.ls.getItem(k));
};

/**
 * Same as setItem, but fails if an item already exists
 */
LocalStorage.prototype.createItem = function(name, value, callback) {
  preconditions.checkArgument(_.isFunction(callback));
  if (this.ls.getItem(name)) {
    return callback('EEXISTS');
  }
  return this.setItem(name, value, callback);
};

LocalStorage.prototype.setItem = function(k,v,cb) {
  preconditions.checkArgument(_.isFunction(cb));
  this.ls.setItem(k,v);
  return cb();
};

LocalStorage.prototype.removeItem = function(k,cb) { 
  preconditions.checkArgument(_.isFunction(cb));
  this.ls.removeItem(k);
  return cb();
};

LocalStorage.prototype.clear = function(cb) { 
  preconditions.checkArgument(_.isFunction(cb));
  this.ls.clear();
  return cb();
};

module.exports = LocalStorage;
