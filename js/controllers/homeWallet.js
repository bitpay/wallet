'use strict';

angular.module('copayApp.controllers').controller('HomeWalletController', function($scope, $rootScope, $timeout, $filter, $modal, rateService, notification, txStatus, identityService, isCordova) {

  $scope.openTxModal = function(tx) {
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      var w = $rootScope.wallet;
      $scope.tx = tx;
      $scope.loading = null;

      $scope.sign = function(ntxid) {
        if (isCordova) {
          window.plugins.spinnerDialog.show(null, 'Signing transaction...', true);
        }
        $scope.loading = true;
        $timeout(function() {
          w.signAndSend(ntxid, function(err, id, status) {
            if (isCordova) {
              window.plugins.spinnerDialog.hide();
            }
            $scope.loading = false;
            if (err)
            $scope.error = err;
            else
            $modalInstance.close(status);
          });
        }, 100);
      };

      $scope.reject = function(ntxid) {
        if (isCordova) {
          window.plugins.spinnerDialog.show(null, 'Rejecting transaction...', true);
        }
        $scope.loading = true;
        $timeout(function() {
          w.reject(ntxid, function(err, status) {
            if (isCordova) {
              window.plugins.spinnerDialog.hide();
            }
            $scope.loading = false;
            if (err)
            $scope.error = err;
            else
            $modalInstance.close(status);
          });
        }, 100);
      };

      $scope.broadcast = function(ntxid) {
        if (isCordova) {
          window.plugins.spinnerDialog.show(null, 'Sending transaction...', true);
        }
        $scope.loading = true;
        $timeout(function() {
          w.issueTx(ntxid, function(err, txid, status) {
            if (isCordova) {
              window.plugins.spinnerDialog.hide();
            }
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
