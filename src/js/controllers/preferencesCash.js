'use strict';

angular.module('copayApp.controllers').controller('preferencesCashController', function($scope, $log, $timeout, appConfigService, lodash, configService, gettextCatalog, externalLinkService) {
  var updateConfig = function() {

    var config = configService.getSync();
    $scope.appName = appConfigService.nameCase;

    $scope.cashSupport = {
      value: config.cashSupport
    };

    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.cashSupportChange = function() {
    var opts = {
      cashSupport: $scope.cashSupport.value
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };


  $scope.openBitcoinCashWeb = function() {
    var url = 'https://www.bitcoincash.org/';
    var optIn = true;
    var title = null;
    var message = gettextCatalog.getString('Open bitcoincash.org?');
    var okText = gettextCatalog.getString('Open');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };


  $scope.$on("$ionicView.enter", function(event, data) {
    updateConfig();
  });
});
