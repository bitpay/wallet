'use strict';

angular.module('copayApp.services').factory('pluginManager', function() {
  var pm = new copay.PluginManager(config);
  return pm;
});
