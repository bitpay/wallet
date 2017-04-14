'use strict';

angular.module('copayApp.controllers').controller('advancedSettingsController', function($scope, $rootScope, $log, $window, lodash, configService, uxLanguage, platformInfo, profileService, feeService, storageService, $ionicHistory, $timeout, $ionicScrollDelegate, ionicToast) {

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

  $scope.nextStepsChange = function() {
    var opts = {
      hideNextSteps: {
        enabled:  $scope.hideNextSteps.value
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

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    updateConfig();
  });

  // Developer mode enabled by tap and hold on view title for 3 seconds.
  // Once on the app needs to restart to disable developer mode.
  //  
  var devModeTimer;

  $scope.hold = function(event) {
    devModeTimer = $timeout(function() {
      $rootScope.devMode = true;
      $rootScope.$emit('Local/DeveloperMode');

      var msg = 'Developer mode enabled';
      $log.info(msg);
      if (platformInfo.isCordova) {
        window.plugins.toast.showShortCenter(msg);
      } else {
        $scope.$apply(function() {
          ionicToast.show(msg, 'middle', false, 1000);
        });
      }
      $timeout.cancel(devModeTimer);
    }, 3000);
  };

  $scope.release = function (event) {
    if (devModeTimer) {
      $timeout.cancel(devModeTimer);
    }
  };

});
