'use strict';

angular.module('copayApp.controllers').controller('txpDetailsController', function($scope, $timeout, bwsError, profileService) {

	var self = $scope.self;
  var fc = profileService.focusedClient;

  $scope.error = null;
  $scope.copayerId = fc.credentials.copayerId;
  $scope.canSign = fc.canSign() || fc.isPrivKeyExternal();
  $scope.loading = null;
  $scope.isShared = fc.credentials.n > 1;

  // ToDo: use tx.customData instead of tx.message
  if ($scope.tx.message === 'Glidera transaction' && $scope.isGlidera) {
    $scope.tx.isGlidera = true;
    if ($scope.tx.canBeRemoved) {
      $scope.tx.canBeRemoved = (Date.now() / 1000 - ($scope.tx.ts || $scope.tx.createdOn)) > GLIDERA_LOCK_TIME;
    }
  }

  refreshUntilItChanges = false;

  $scope.getShortNetworkName = function() {
    return fc.credentials.networkName.substring(0, 4);
  };
  lodash.each(['TxProposalRejectedBy', 'TxProposalAcceptedBy', 'transactionProposalRemoved', 'TxProposalRemoved', 'NewOutgoingTx', 'UpdateTx'], function(eventName) {
    $rootScope.$on(eventName, function() {
      fc.getTx($scope.tx.id, function(err, tx) {
        if (err) {

          if (err.code && err.code == 'TX_NOT_FOUND' &&
            (eventName == 'transactionProposalRemoved' || eventName == 'TxProposalRemoved')) {
            $scope.tx.removed = true;
            $scope.tx.canBeRemoved = false;
            $scope.tx.pendingForUs = false;
            $scope.$apply();
            return;
          }
          return;
        }

        var action = lodash.find(tx.actions, {
          copayerId: fc.credentials.copayerId
        });
        $scope.tx = txFormatService.processTx(tx);
        if (!action && tx.status == 'pending')
          $scope.tx.pendingForUs = true;
        $scope.updateCopayerList();
        $scope.$apply();
      });
    });
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
    var fc = profileService.focusedClient;

    if (!fc.canSign() && !fc.isPrivKeyExternal())
      return;

    if (fc.isPrivKeyEncrypted()) {
      profileService.unlockFC(function(err) {
        if (err) {
          $scope.error = bwsError.msg(err);
          return;
        }
        return $scope.sign(txp);
      });
      return;
    };

    self._setOngoingForSigning();
    $scope.loading = true;
    $scope.error = null;
    $timeout(function() {
      requestTouchid(function(err) {
        if (err) {
          self.setOngoingProcess();
          $scope.loading = false;
          profileService.lockFC();
          $scope.error = err;
          $scope.$digest();
          return;
        }

        profileService.signTxProposal(txp, function(err, txpsi) {
          self.setOngoingProcess();
          if (err) {
            $scope.$emit('UpdateTx');
            $scope.loading = false;
            $scope.error = bwsError.msg(err, gettextCatalog.getString('Could not accept payment'));
            $scope.$digest();
          } else {
            //if txp has required signatures then broadcast it
            var txpHasRequiredSignatures = txpsi.status == 'accepted';
            if (txpHasRequiredSignatures) {
              self.setOngoingProcess(gettext('Broadcasting transaction'));
              $scope.loading = true;
              fc.broadcastTxProposal(txpsi, function(err, txpsb, memo) {
                self.setOngoingProcess();
                $scope.loading = false;
                if (err) {
                  $scope.$emit('UpdateTx');
                  $scope.error = bwsError.msg(err, gettextCatalog.getString('Could not broadcast payment'));
                  $scope.$digest();
                } else {
                  $log.debug('Transaction signed and broadcasted')
                  if (memo)
                    $log.info(memo);

                  refreshUntilItChanges = true;
                  $scope.close(txpsb);
                }
              });
            } else {
              $scope.loading = false;
              $scope.close(txpsi);
            }
          }
        });
      });
    }, 100);
  };

  $scope.reject = function(txp) {
    self.setOngoingProcess(gettext('Rejecting payment'));
    $scope.loading = true;
    $scope.error = null;
    $timeout(function() {
      fc.rejectTxProposal(txp, null, function(err, txpr) {
        self.setOngoingProcess();
        $scope.loading = false;
        if (err) {
          $scope.$emit('UpdateTx');
          $scope.error = bwsError.msg(err, gettextCatalog.getString('Could not reject payment'));
          $scope.$digest();
        } else {
          $scope.close(txpr);
        }
      });
    }, 100);
  };


  $scope.remove = function(txp) {
    self.setOngoingProcess(gettext('Deleting payment'));
    $scope.loading = true;
    $scope.error = null;
    $timeout(function() {
      fc.removeTxProposal(txp, function(err, txpb) {
        self.setOngoingProcess();
        $scope.loading = false;

        // Hacky: request tries to parse an empty response
        if (err && !(err.message && err.message.match(/Unexpected/))) {
          $scope.$emit('UpdateTx');
          $scope.error = bwsError.msg(err, gettextCatalog.getString('Could not delete payment proposal'));
          $scope.$digest();
          return;
        }
        $scope.close();
      });
    }, 100);
  };

  $scope.broadcast = function(txp) {
    self.setOngoingProcess(gettext('Broadcasting Payment'));
    $scope.loading = true;
    $scope.error = null;
    $timeout(function() {
      fc.broadcastTxProposal(txp, function(err, txpb, memo) {
        self.setOngoingProcess();
        $scope.loading = false;
        if (err) {
          $scope.error = bwsError.msg(err, gettextCatalog.getString('Could not broadcast payment'));
          $scope.$digest();
        } else {

          if (memo)
            $log.info(memo);

          refreshUntilItChanges = true;
          $scope.close(txpb);
        }
      });
    }, 100);
  };

  $scope.copyAddress = function(addr) {
    if (!addr) return;
    self.copyAddress(addr);
  };

  $scope.close = function(txp) {
    self.setOngoingProcess();
    if (txp) {
      txStatus.notify(txp, function() {
        $scope.$emit('Local/TxProposalAction', refreshUntilItChanges);
      });
    } else {
      $timeout(function() {
        $scope.$emit('Local/TxProposalAction', refreshUntilItChanges);
      }, 100);
    }
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.txpDetailsModal.hide();
    $scope.txpDetailsModal.remove();
    $rootScope.modalOpened = false;
  };

});