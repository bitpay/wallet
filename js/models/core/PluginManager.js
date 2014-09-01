'use strict';
var preconditions = require('preconditions').singleton();

function PluginManager(config) {
  this.registered = {};

  for(var ii in config.plugins){
    var pluginName = ii;

    if (!config.plugins[pluginName])
      continue;

    console.log('Loading ' + pluginName);
    var pluginClass = require('../plugins/' + pluginName);
    var pluginObj  = new pluginClass();
    pluginObj.init();
    this._register(pluginObj);
  }
};

var KIND_UNIQUE = PluginManager.KIND_UNIQUE = 1;
var KIND_MULTIPLE = PluginManager.KIND_MULTIPLE = 2;

PluginManager.TYPE = {};
PluginManager.TYPE['STORAGE'] = KIND_UNIQUE;

PluginManager.prototype._register = function(obj) {
  preconditions.checkArgument(obj.type,'Plugin has not type');
  var type = obj.type;
console.log('[PluginManager.js.29:type:]',type); //TODO

  var kind = PluginManager.TYPE[type];
  preconditions.checkArgument(kind, 'Plugin has unkown type');
  preconditions.checkState(kind !== PluginManager.KIND_UNIQUE || !this.registered[type], 'Plugin kind already registered');

  if (kind === PluginManager.KIND_UNIQUE) {
    this.registered[type] = obj;
  } else {
    this.registered[type] = this.registered[type] || [];
    this.registered[type].push(obj);
  }
};

PluginManager.prototype.getOne = function(type) {};

module.exports = PluginManager;
