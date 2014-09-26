'use strict';
angular.module('copayApp.services').factory('identity', function(pluginManager){ 
  return new copay.Identity(config, copay.version, pluginManager);
});

