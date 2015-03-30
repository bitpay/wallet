'use strict';


// TODO rateService
angular.module('copayApp.controllers').controller('walletHomeController', function($scope, $rootScope, $timeout, $filter, $modal, notification, txStatus, isCordova, profileService, lodash) {

  $scope.openTxModal = function(tx, copayers) {
    console.log('[walletHome.js:7]', tx); //TODO
    var fc = profileService.focusedClient;
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.error = null;
      $scope._cache = tx;
      $scope.tx = tx;
      $scope.copayers = copayers
      $scope.loading = null;

      $scope.getShortNetworkName = function() {
        return fc.networkName.substring(0, 4);
      };

      lodash.each(['TxProposalRejectedBy', 'TxProposalAcceptedBy'], function(eventName) {
        $rootScope.$on(eventName, function() {
          fc.getTxProposals({}, function(err, txps) {
            var tx = lodash.find(txps, {
              'id': $scope._cache.id
            });
            if (tx) {
              var action = lodash.find(tx.actions, {
                copayerId: fc.copayerId
              });
              $scope.tx = tx;
              if (!action && tx.status == 'pending')
                $scope.tx.pendingForUs = true;
              $scope.updateCopayerList();
              $scope.$apply();
            }
          });
        });
      });

      $rootScope.$on('TxProposalFinallyRejected', function(e) {
        $scope.txRejected = true;
      });

      $rootScope.$on('NewOutgoingTx', function(e) {
        $scope.txBroadcasted = true;
      });

      $scope.updateCopayerList = function() {
        lodash.map($scope.copayers, function(cp) {
          lodash.each($scope.tx.actions, function(ac) {
            if (cp.id == ac.copayerId) {
              cp.action = ac.type;
            }
          });
        });
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
              $scope.error = err.message || 'Transaction not signed. Please try again.';
              $scope.$digest();
            } else {
              //if txp has required signatures then broadcast it
              var txpHasRequiredSignatures = txp.status == 'accepted';
              if (txpHasRequiredSignatures) {
                fc.broadcastTxProposal(txp, function(err) {
                  if (err) {
                    $scope.error = 'Transaction not broadcasted. Please try again.';
                    $scope.$digest();
                  } else {
                    $modalInstance.close(txp);
                  }
                });
              } else {
                $modalInstance.close(txp);
              }
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
              $scope.error = err.message || 'Transaction not rejected. Please try again.';
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
              $scope.error = err.message || 'Transaction not sent. Please try again.';
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
      $scope.$emit('Local/TxProposalAction');
    });

  };

});
