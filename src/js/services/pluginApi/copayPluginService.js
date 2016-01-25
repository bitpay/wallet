'use strict';
angular.module('copayApp.services').factory('copayPluginService', function(PluginRegistry) {

  var root = {};

	// Return the plugin registry entry for the specified id.
	// 
	root.getRegistryEntry = function(id) {
	  return PluginRegistry.getEntry(id);
	};

  return root;
});