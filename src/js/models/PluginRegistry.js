'use strict';
angular.module('copayApp.model').factory('PluginRegistry', function (plugins, lodash) {

  // Constructor
  //
  function PluginRegistry() {
    throw new Error('PluginRegistry is a static class, do not instantiate this class');
  };

  // Static methods
  // 
  PluginRegistry.checkEntry = function(id) {
    // Throws exception if not found.
    PluginRegistry.getEntry(id);
  };

  PluginRegistry.getEntry = function(id) {
    var index = lodash.findIndex(plugins, function(plugin) {
      return (plugin.id == id);
    });
    if (index < 0) {
      throw new Error('Could not find service plugin with id \'' + id + '\'');
    }
    return plugins[index];
  };

  PluginRegistry.getUIPlugins = function() {
    return lodash.filter(plugins, function(plugin) {
      return plugin.type == 'ui';
    });
  };

  PluginRegistry.getServiceProviderClass = function(id) {
    return PluginRegistry.getEntry(id).serviceClass;
  };

  return PluginRegistry;
});
