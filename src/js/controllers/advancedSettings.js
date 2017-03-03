'use strict';

angular.module('copayApp.controllers').controller('advancedSettingsController', function($scope, $rootScope, $timeout, $state, $log, $window, $ionicModal, lodash, configService, uxLanguage, platformInfo, pushNotificationsService, profileService, feeService, storageService, $ionicHistory, $ionicScrollDelegate, pincodeService) {

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
    $scope.usePincode = {
      enabled: config.pincode ? config.pincode.enabled : false
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

  $scope.usePincodeChange = function() {
    // pincodeService.lockChange({
    //   fromSettings: true,
    //   locking: $scope.usePincode.enabled
    // });
    $state.go('tabs.pincode', {
      fromSettings: true,
      locking: $scope.usePincode.enabled
    });
  };

  $rootScope.$on('updatePincodeOption', function(event) {
    $timeout(function() {
      var config = configService.getSync();
      $scope.usePincode = {
        enabled: config.pincode ? config.pincode.enabled : false
      };
      $scope.$apply();
    });
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    updateConfig();
  });

});
