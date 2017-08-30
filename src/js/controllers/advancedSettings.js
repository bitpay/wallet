'use strict';

angular.module('copayApp.controllers').controller('advancedSettingsController', function($scope, $log, configService, platformInfo, externalLinkService) {

  var updateConfig = function() {
    var config = configService.getSync();

    $scope.spendUnconfirmed = {
      value: config.wallet.spendUnconfirmed
    };
    $scope.recentTransactionsEnabled = {
      value: config.recentTransactions.enabled
    };
    $scope.hideNextSteps = {
      value: config.hideNextSteps.enabled
    };
    $scope.cashSupport = {
      value: config.cashSupport.enabled
    };

  };

  $scope.spendUnconfirmedChange = function() {
    var opts = {
      wallet: {
        spendUnconfirmed: $scope.spendUnconfirmed.value
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };


  $scope.cashSupportChange = function() {
    var opts = {
      cashSupport: {
        enabled: $scope.cashSupport.value
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };


  $scope.nextStepsChange = function() {
    var opts = {
      hideNextSteps: {
        enabled: $scope.hideNextSteps.value
      },
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };

  $scope.recentTransactionsChange = function() {
    var opts = {
      recentTransactions: {
        enabled: $scope.recentTransactionsEnabled.value
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };

  $scope.openExternalLink = function(url) {
    externalLinkService.open(url);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;
    updateConfig();
  });

});
