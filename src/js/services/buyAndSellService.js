'use strict';

angular.module('copayApp.services').factory('buyAndSellService', function($log, nextStepsService, lodash, $ionicScrollDelegate, $timeout) {
  var root = {};
  var services = [];
  var linkedServices = [];

  root.updateNextSteps = function() {

    var newLinked = lodash.filter(services, function(x) {
      return x.linked;
    });


    // This is to preserve linkedServices pointer
    while(linkedServices.length)
      linkedServices.pop();

    while(newLinked.length)
      linkedServices.push(newLinked.pop());
    //

console.log('[buyAndSellService.js.10:linkedServices:]',linkedServices); //TODO

    $log.debug('buyAndSell Service, updating nextSteps. linked/total: ' + linkedServices.length + '/'+  services.length);

    if (linkedServices.length == 0) {
      nextStepsService.register({
        name: 'Buy and Sell',
        icon: 'icon-buy-bitcoin',
        sref: 'tabs.buyandsell',
      });
    };


    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 10);
  };

  var updateNextStepsDebunced = lodash.debounce(root.updateNextSteps, 1000);

  root.register = function(serviceInfo) {
    services.push(serviceInfo);
    $log.info('Adding Buy and Sell service:' + serviceInfo.name + ' linked:' + serviceInfo.linked);
    updateNextStepsDebunced();
  };

  root.get = function() {
    return services;
  };


  root.getLinked = function() {
    return linkedServices;
  };


  return root;
});
