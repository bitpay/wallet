'use strict';

angular.module('copayApp.controllers').controller('walletBalanceController', function($scope, $timeout, $ionicHistory, gettextCatalog, configService, feeService, ongoingProcess, popupService) {

  ongoingProcess.set('gettingFeeLevels', true);
  feeService.getFeeLevels(function(err, levels) {
    ongoingProcess.set('gettingFeeLevels', false);
    if (err) {
      popupService.showAlert(gettextCatalog.getString('Error'), err);
      return;
    }
    $scope.feeLevels = levels;
    $scope.$apply();
  });

  $scope.close = function() {
    $scope.walletBalanceModal.hide();
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
  });
});
