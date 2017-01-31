 'use strict';
 angular.module('copayApp.services').factory('nextStepsService', function(configService, $log, lodash) {
   var root = {};
   var services = [];

   root.register = function(serviceInfo) {
     $log.info('Adding NextSteps entry:' + serviceInfo.name);

     if (!lodash.find(services, function(x) {
         return x.name == serviceInfo.name;
       })) {
       services.push(serviceInfo);
     }
   };

   root.unregister = function(serviceName) {

     var newS = lodash.filter(services, function(x) {
       return x.name != serviceName;
     });

     // Found?
     if (newS.length == services.length) return;

     $log.info('Removing NextSteps entry:' + serviceName);
     // This is to preserve services pointer
     while (services.length)
       services.pop();

     while (newS.length)
       services.push(newS.pop());
   };

   root.get = function() {
     return services;
   };

   return root;

 });
