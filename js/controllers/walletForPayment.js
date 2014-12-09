var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('walletForPaymentController', function($rootScope, $scope, $modal, identityService, go) {

  $scope.selectWallet = function(cb) {
    var ModalInstanceCtrl = function($scope, $modalInstance, identityService) {
      $scope.loading = true;
      preconditions.checkState($rootScope.iden);

      var iden = $rootScope.iden;
      iden.on('newWallet', function() {
        $scope.setWallets();
      });

      $scope.setWallets = function() {
        $scope.wallets = $rootScope.iden.listWallets();
      };

      $scope.ok = function(w) {
        $modalInstance.close();
        return cb(w);
      };

      $scope.cancel = function() {
        $modalInstance.close();
        return cb();
      };
    };

    $modal.open({
      templateUrl: 'views/modals/walletSelection.html',
      windowClass: 'tiny',
      controller: ModalInstanceCtrl,
    });
  };


  // INIT: (not it a function, since there is no associated html)
  if (!$rootScope.pendingPayment) {
    go.walletHome();
  } else {
    $scope.selectWallet(function(w) {
      if (w) {
        identityService.setFocusedWallet(w);
        go.send();
      } else {
        go.walletHome();
      }
    });
  };
});
