'use strict';

angular.module('copayApp.controllers').controller('PaymentIntentController', function($rootScope, $scope, $modal, $location, balanceService) {

  $scope.wallets = [];
  $rootScope.title = 'Payment intent';
  $scope.wallets = $rootScope.iden.listAllWallets();

  var l = $scope.wallet.length;
  _.each($scope.wallets, function(w, i) {
    balanceService.update(w, function(){
      if (i === l-1) 
        $rootScope.$digest();
    });
  });

  $scope.open = function() {
    var modalInstance = $modal.open({
      templateUrl: 'myModalContent.html',
      controller: ModalInstanceCtrl,
      resolve: {
        items: function() {
          return $scope.wallets;
        }
      }
    });
  };


  // Please note that $modalInstance represents a modal window (instance) dependency.
  // It is not the same as the $modal service used above.

  var ModalInstanceCtrl = function($scope, $modalInstance, items, identityService) {
    $scope.wallets = items;
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
