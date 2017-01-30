 'use strict';
 angular.module('copayApp.services').factory('nextStepsService', function(configService, $log) {
   var root = {};

   //
   // configService.whenAvailable(function() {
   //   nextStep(function() {
   //     var config = configService.getSync();
   //     var isWindowsPhoneApp = platformInfo.isWP && platformInfo.isCordova;
   //
   //     $scope.glideraEnabled = config.glidera.enabled && !isWindowsPhoneApp;
   //     $scope.coinbaseEnabled = config.coinbaseV2 && !isWindowsPhoneApp;
   //     $scope.amazonEnabled = config.amazon.enabled;
   //     $scope.bitpayCardEnabled = config.bitpayCard.enabled;


   var services = [];

   root.register = function(serviceInfo) {
     $log.info('Adding NextSteps entry:' + serviceInfo.name);
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
