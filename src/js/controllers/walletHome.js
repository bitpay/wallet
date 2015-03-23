'use strict';


// TODO rateService
angular.module('copayApp.controllers').controller('walletHomeController', function($scope, $rootScope, $timeout, $filter, $modal, notification, txStatus, isCordova, profileService) {

  $rootScope.$emit('updatePendingTxs');

  $scope.openTxModal = function(tx) {
    var fc = profileService.focusedClient;
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.error = null;
      $scope.tx = tx;
      $scope.loading = null;

      $scope.getShortNetworkName = function() {
        return fc.networkName.substring(0, 4);
      };

      $scope.sign = function(txp) {
        if (isCordova) {
          window.plugins.spinnerDialog.show(null, 'Signing transaction...', true);
        }
        $scope.loading = true;
        $scope.error = null;
        $timeout(function() {
          fc.signTxProposal(txp, function(err, txp) {
            if (isCordova) {
              window.plugins.spinnerDialog.hide();
            }
            $scope.loading = false;
            if (err) {
              $scope.error = 'Transaction could not send. Please try again.';
              $scope.$digest();
            } else {
              $modalInstance.close(txp);
            }
          });
        }, 100);
      };

      $scope.reject = function(txp) {
        if (isCordova) {
          window.plugins.spinnerDialog.show(null, 'Rejecting transaction...', true);
        }
        $scope.loading = true;
        $scope.error = null;
        $timeout(function() {
          fc.rejectTxProposal(txp, null, function(err, txp) {
            if (isCordova) {
              window.plugins.spinnerDialog.hide();
            }
            $scope.loading = false;
            if (err) {
              $scope.error = err;
              $scope.$digest();
            } else {
              $modalInstance.close(txp);
            }
          });
        }, 100);
      };

      $scope.broadcast = function(txp) {
        if (isCordova) {
          window.plugins.spinnerDialog.show(null, 'Sending transaction...', true);
        }
        $scope.loading = true;
        $scope.error = null;
        $timeout(function() {
          fc.broadcastTxProposal(txp, function(err, txp) {
            if (isCordova) {
              window.plugins.spinnerDialog.hide();
            }
            $scope.loading = false;
            if (err) {
              $scope.error = 'Transaction could not send. Please try again.';
              $scope.$digest();
            } else {
              $modalInstance.close(txp);
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
      windowClass: 'full',
      controller: ModalInstanceCtrl,
    });

    modalInstance.result.then(function(txp) {
      txStatus.notify(txp);
      $rootScope.$emit('updateStatus');
    });

  };






});
