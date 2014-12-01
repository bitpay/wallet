'use strict';

angular.module('copayApp.controllers').controller('PaymentIntentController', function($rootScope, $scope, $modal, $location, balanceService) {

  $rootScope.title = 'Payment intent'; 

  $scope.open = function() { 
    var modalInstance = $modal.open({
      templateUrl: 'myModalContent.html',
      controller: ModalInstanceCtrl
    });
  };


  // Please note that $modalInstance represents a modal window (instance) dependency.
  // It is not the same as the $modal service used above.

  var ModalInstanceCtrl = function($scope, $modalInstance, identityService) {
    $scope.loading = true;
    $scope.setWallets = function() {
      if (!$rootScope.iden) return;
      var ret = _.filter($rootScope.iden.listWallets(), function(w) {
        return w.balanceInfo && w.balanceInfo.totalBalanceBTC;
      });
      $scope.wallets = ret;
      $scope.loading = false;
    };
    if ($rootScope.iden) {
      var iden = $rootScope.iden;
      iden.on('newWallet', function() {
        $scope.setWallets();
      });
    }
    $scope.ok = function(selectedItem) {
      identityService.setPaymentWallet(selectedItem);
      $modalInstance.close();
    };

    $scope.cancel = function() {
      $rootScope.pendingPayment = null;
      $modalInstance.close();
      $location.path('/homeWallet');
    };
  };

});
