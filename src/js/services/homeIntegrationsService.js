 'use strict';
 angular.module('copayApp.services').factory('homeIntegrationsService', function($rootScope, lodash, configService, $log) {
  var root = {};
  var services = [];

  root.register = function(serviceInfo) {
    // Check if already exists
    if (lodash.find(services, { 'name': serviceInfo.name })) return;
    $log.info('Adding home Integrations entry:' + serviceInfo.name);
    services.push(serviceInfo);
    $rootScope.$emit('Local/HomeIntegrationsChanged');
  };

  root.unregister = function(serviceName) {
    var n = services.length;
    services = lodash.filter(services, function(x) {
      return x.name != serviceName;
    });
    if (n != services.length) {
      $rootScope.$emit('Local/HomeIntegrationsChanged');
    }
  };

  root.get = function() {
    var s = lodash.filter(services, function(x) {
      return !x.devMode || (x.devMode && $rootScope.devMode);
    });
    return s;
  };

  return root;

});
