var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('walletForPaymentController', function($rootScope, $scope, $modal, identityService, go) {

  // INIT: (not it a function, since there is no associated html)

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
      $modalInstance.close(w);
    };

    $scope.cancel = function() {
      $rootScope.pendingPayment = null;
      $modalInstance.close();
    };
  };

  var modalInstance = $modal.open({
    templateUrl: 'views/modals/walletSelection.html',
    windowClass: 'small',
    controller: ModalInstanceCtrl,
  });

  modalInstance.result.then(function(w) {
    if (w) {
      identityService.setFocusedWallet(w);
      $rootScope.walletForPaymentSet = true;
    } else {
      $rootScope.pendingPayment = null;
    }
    go.walletHome();
  }, function() {
    $rootScope.pendingPayment = null;
    go.walletHome();
  });
});
