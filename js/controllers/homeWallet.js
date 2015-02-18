'use strict';

angular.module('copayApp.controllers').controller('HomeWalletController', function($scope, $rootScope, $timeout, $filter, $modal, rateService, notification, txStatus, identityService, isCordova) {

  $scope.openTxModal = function(tx) {
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      var w = $rootScope.wallet;
      $scope.error = null;
      $scope.tx = tx;
      $scope.registeredCopayerIds = w.getRegisteredCopayerIds();
      $scope.loading = null;

      $scope.getShortNetworkName = function() {
        var w = $rootScope.wallet;
        return w.getNetworkName().substring(0, 4);
      };

      $scope.sign = function(ntxid) {
        if (isCordova) {
          window.plugins.spinnerDialog.show(null, 'Signing transaction...', true);
        }
        $scope.loading = true;
        $scope.error = null;
        $timeout(function() {
          w.signAndSend(ntxid, function(err, id, status) {
            if (isCordova) {
              window.plugins.spinnerDialog.hide();
            }
            $scope.loading = false;
            if (err) {
              $scope.error = 'Transaction could not send. Please try again.';
              $scope.$digest();
            }
            else {
              $modalInstance.close(status);
            }
          });
        }, 100);
      };

      $scope.reject = function(ntxid) {
        if (isCordova) {
          window.plugins.spinnerDialog.show(null, 'Rejecting transaction...', true);
        }
        $scope.loading = true;
        $scope.error = null;
        $timeout(function() {
          w.reject(ntxid, function(err, status) {
            if (isCordova) {
              window.plugins.spinnerDialog.hide();
            }
            $scope.loading = false;
            if (err) {
              $scope.error = err;
              $scope.$digest();
            }
            else {
              $modalInstance.close(status);
            }
          });
        }, 100);
      };

      $scope.broadcast = function(ntxid) {
        if (isCordova) {
          window.plugins.spinnerDialog.show(null, 'Sending transaction...', true);
        }
        $scope.loading = true;
        $scope.error = null;
        $timeout(function() {
          w.issueTx(ntxid, function(err, txid, status) {
            if (isCordova) {
              window.plugins.spinnerDialog.hide();
            }
            $scope.loading = false;
            if (err) {
              $scope.error = 'Transaction could not send. Please try again.';
              $scope.$digest();
            }
            else {
              $modalInstance.close(status);
            }
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
