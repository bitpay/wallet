 'use strict';
 angular.module('copayApp.services').factory('homeIntegrationsService', function(configService, $log) {
   var root = {};
   var services = [];

   root.register = function(serviceInfo) {
     $log.info('Adding home Integrations entry:' + serviceInfo.name);
     services.push(serviceInfo);
   };

   root.unregister = function(serviceName) {
     services = lodash.filter(services, function(x) {
       return x.name != serviceName
     });
   };

   root.get = function() {
     return services;
   };

   return root;

 });
