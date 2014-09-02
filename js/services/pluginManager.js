'use strict';

angular.module('copayApp.services').factory('pluginManager', function(angularLoad){ 
  return new copay.PluginManager(config);
});
