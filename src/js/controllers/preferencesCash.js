'use strict';

angular.module('copayApp.controllers').controller('preferencesCashController', function($scope, $log, $timeout, appConfigService, lodash, configService, platformInfo, pushNotificationsService, emailService) {
  var updateConfig = function() {
    var config = configService.getSync();
    $scope.appName = appConfigService.nameCase;

    $scope.cashSupport = {
      value: config.wallet.cashSupport.enabled
    };

    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.cashSupportChange = function() {
    var opts = {
      wallet: {
        cashSupport: $scope.cashSupport.value
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    updateConfig();
  });
});
