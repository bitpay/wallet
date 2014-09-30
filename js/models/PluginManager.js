'use strict';
var preconditions = require('preconditions').singleton();
var log = require('../log');

function PluginManager(config) {
  this.registered = {};
  this.scripts = [];

  for (var ii in config.plugins) {
    var pluginName = ii;

    if (!config.plugins[pluginName])
      continue;

    log.info('Loading plugin: ' + pluginName);
    var pluginClass = require('../plugins/' + pluginName);
    var pluginObj = new pluginClass(config[pluginName]);
    pluginObj.init();
    this._register(pluginObj, pluginName);
  }
};

var KIND_UNIQUE = PluginManager.KIND_UNIQUE = 1;
var KIND_MULTIPLE = PluginManager.KIND_MULTIPLE = 2;

PluginManager.TYPE = {};
PluginManager.TYPE['DB'] = KIND_UNIQUE;

PluginManager.prototype._register = function(obj, name) {
  preconditions.checkArgument(obj.type, 'Plugin has not type:' + name);
  var type = obj.type;
  var kind = PluginManager.TYPE[type];

  preconditions.checkArgument(kind, 'Unknown plugin type:' + name);
  preconditions.checkState(kind !== PluginManager.KIND_UNIQUE || !this.registered[type], 'Plugin kind already registered:' + name);

  if (kind === PluginManager.KIND_UNIQUE) {
    this.registered[type] = obj;
  } else {
    this.registered[type] = this.registered[type] || [];
    this.registered[type].push(obj);
  }

  this.scripts = this.scripts.concat(obj.scripts || []);
};


PluginManager.prototype.get = function(type) {
  return this.registered[type];
};

module.exports = PluginManager;
