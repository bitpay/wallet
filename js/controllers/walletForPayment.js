var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('walletForPaymentController', function($rootScope, $scope, $modal,  go) {

console.log('[walletForPayment.js.4]'); //TODO
  if (!$rootScope.pendingPayment) {
    go.walletHome();
  } else {

console.log('[walletForPayment.js.9]'); //TODO
    $scope.selectWallet(function(w) {
      if (w) {
        identityService.setFocusedWallet(w);
        go.send();
      } else {
        go.walletHome();
      }
    });
  }

  $scope.selectWallet = function(cb) {

console.log('[walletForPayment.js.22]'); //TODO
    var ModalInstanceCtrl = function($scope, $modalInstance, $identityService) {
      $scope.loading = true;
      preconditions.checkState($rootScope.iden);

      var iden = $rootScope.iden;
      iden.on('newWallet', function() {
        $scope.setWallets();
      });

      $scope.setWallets = function() {
        $scope.wallets = _.filter($rootScope.iden.listWallets(), function(w) {
          return w.balanceInfo && w.balanceInfo.totalBalanceBTC;
        });
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

console.log('[walletForPayment.js.49]'); //TODO
    $modal.open({
      templateUrl: 'views/modals/walletSelect.html',
      windowClass: 'tiny',
      controller: ModalInstanceCtrl,
    });
  };
});
