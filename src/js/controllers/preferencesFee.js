'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController', function($scope, $rootScope, $timeout, $ionicHistory, lodash, gettextCatalog, configService, feeService, ongoingProcess, popupService) {

  $scope.save = function(newFee) {
    var opts = {
      wallet: {
        settings: {
          feeLevel: newFee
        }
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      $scope.currentFeeLevel = newFee;
      updateCurrentValues();
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  function hideTabs() {
    $timeout(function() {
      $rootScope.hideTabs = 'tabs-item-hide';
      $rootScope.$apply();
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {

    if ($ionicHistory.backView() && ($ionicHistory.backView().stateName == 'tabs.send.confirm')) hideTabs();
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
    $scope.loadingFee = true;
    feeService.getFeeLevels(function(err, levels) {
      $scope.loadingFee = false;
      if (err) {
        //Error is already formatted
        popupService.showAlert(err);
        return;
      }
      $scope.feeLevels = levels;
      updateCurrentValues();
      $scope.$apply();
    });
  });

  var updateCurrentValues = function() {
    if (lodash.isEmpty($scope.feeLevels) || lodash.isEmpty($scope.currentFeeLevel)) return;
    var feeLevelValue = lodash.find($scope.feeLevels['livenet'], {
      level: $scope.currentFeeLevel
    });
    if (lodash.isEmpty(feeLevelValue)) {
      $scope.feePerSatByte = null;
      $scope.avgConfirmationTime = null;
      return;
    }
    $scope.feePerSatByte = (feeLevelValue.feePerKB / 1000).toFixed();
    $scope.avgConfirmationTime = feeLevelValue.nbBlocks * 10;
  };
});
