 'use strict';
 angular.module('copayApp.services').factory('nextStepsService', function($rootScope, configService, $log, lodash) {
   var root = {};
   var services = [];

   root.register = function(serviceInfo) {
     $log.info('Adding NextSteps entry:' + serviceInfo.name);

     if (!lodash.find(services, function(x) {
         return x.name == serviceInfo.name;
       })) {
       services.push(serviceInfo);
      $rootScope.$emit('Local/NextStepsChanged');
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

      $rootScope.$emit('Local/NextStepsChanged');
   };

   root.get = function() {
     var s = lodash.filter(services, function(x) {
       return !x.devMode || (x.devMode && $rootScope.devMode);
     });
     return s;
   };

   return root;

 });
