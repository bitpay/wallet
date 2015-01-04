'use strict';

var watching;
angular.module('copayApp.controllers').controller('HomeWalletController', function($scope, $rootScope, $timeout, $filter, $modal, rateService, notification, txStatus, identityService) {

  $scope.initHome = function() {
    $rootScope.title = 'Home';
    if (!watching) {
      watching = $rootScope.$watch('wallet', function (w) {
        $scope.isShared = w.isShared();
        $scope.requiresMultipleSignatures = w.requiresMultipleSignatures();
        if ($scope.isShared)
          $scope.copayers = w.getRegisteredPeerIds();
      });
    }
    }; 

  $scope.openTxModal = function(tx) {
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      var w = $rootScope.wallet;
      $scope.tx = tx;
      $scope.loading = null;

      $scope.sign = function(ntxid) {
        $scope.loading = true;
        $timeout(function() {
          w.signAndSend(ntxid, function(err, id, status) {
            $scope.loading = false;
            if (err)
            $scope.error = err;
            else
            $modalInstance.close(status);
          });
        }, 100);
      };

      $scope.reject = function(ntxid) {
        $scope.loading = true;
        $timeout(function() {
          w.reject(ntxid, function(err, status) {
            $scope.loading = false;
            if (err)
            $scope.error = err;
            else
            $modalInstance.close(status);
          });
        }, 100);
      };

      $scope.broadcast = function(ntxid) {
        $scope.loading = true;
        $timeout(function() {
          w.issueTx(ntxid, function(err, txid, status) {
            $scope.loading = false;
            if (err)
              $scope.error = err;
            $modalInstance.close(status);
          });
        }, 100);
      };

      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };
    };

    var modalInstance = $modal.open({
      templateUrl: 'views/modals/txp-details.html',
      windowClass: 'medium',
      controller: ModalInstanceCtrl,
    });

    modalInstance.result.then(function(status) {
      txStatus.notify(status);
    });

  };
});
