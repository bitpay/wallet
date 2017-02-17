'use strict';

angular.module('copayApp.services').factory('buyAndSellService', function($log, nextStepsService, lodash, $ionicScrollDelegate, $timeout) {
  var root = {};
  var services = [];
  var linkedServices = [];

  root.update = function() {

    var newLinked = lodash.filter(services, function(x) {
      return x.linked;
    });

    // This is to preserve linkedServices pointer
    while (linkedServices.length)
      linkedServices.pop();

    while (newLinked.length)
      linkedServices.push(newLinked.pop());
    //

    $log.debug('buyAndSell Service, updating nextSteps. linked/total: ' + linkedServices.length + '/' + services.length);

    if (linkedServices.length == 0) {
      nextStepsService.register({
        title: 'Buy or Sell Bitcoin',
        name: 'buyandsell',
        icon: 'icon-buy-bitcoin',
        sref: 'tabs.buyandsell',
      });
    } else {
      nextStepsService.unregister({
        name: 'buyandsell',
      });
    };

    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 10);
  };

  var updateNextStepsDebunced = lodash.debounce(root.update, 1000);

  root.register = function(serviceInfo) {
    services.push(serviceInfo);
    $log.info('Adding Buy and Sell service:' + serviceInfo.name + ' linked:' + serviceInfo.linked);
    updateNextStepsDebunced();
  };


  root.updateLink = function(name, linked) {
    var service = lodash.find(services, function(x) {
      return x.name == name;
    });
    $log.info('Updating Buy and Sell service:' + name + ' linked:' + linked);
    service.linked = linked

    root.update();
  };


  root.get = function() {
    return services;
  };


  root.getLinked = function() {
    return linkedServices;
  };


  return root;
});
