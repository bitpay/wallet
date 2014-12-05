'use strict';

angular.module('copayApp.services').factory('pluginManager', function() {
  var root = {};
  root.getInstance = function(config){
    return new copay.PluginManager(config);
  };

  return root;
});
