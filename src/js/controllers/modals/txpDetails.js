'use strict';

angular.module('copayApp.controllers').controller('txpDetailsController', function($scope, $rootScope, $timeout, $interval, $ionicModal, ongoingProcess, platformInfo, txStatus, $ionicScrollDelegate, txFormatService, fingerprintService, bwcError, gettextCatalog, lodash, profileService, walletService) {
  var self = $scope.self;
  var tx = $scope.tx;
  var copayers = $scope.copayers;
  var isGlidera = $scope.isGlidera;
  var now = Math.floor(Date.now() / 1000);
  var fc = profileService.focusedClient;
  $scope.loading = null;
  $scope.copayerId = fc.credentials.copayerId;
  $scope.isShared = fc.credentials.n > 1;
  $scope.canSign = fc.canSign() || fc.isPrivKeyExternal();
  $scope.color = fc.backgroundColor;

  checkPaypro();

  // ToDo: use tx.customData instead of tx.message
  if (tx.message === 'Glidera transaction' && isGlidera) {
    tx.isGlidera = true;
    if (tx.canBeRemoved) {
      tx.canBeRemoved = (Date.now() / 1000 - (tx.ts || tx.createdOn)) > GLIDERA_LOCK_TIME;
    }
  }

  $scope.sign = function(txp) {
    $scope.error = null;
    $scope.loading = true;

    $timeout(function() {
      fingerprintService.check(fc, function(err) {
        if (err) {
          $scope.error = gettextCatalog.getString('Could not send payment');
          $scope.loading = false;
          $timeout(function() {
            $scope.$digest();
          }, 1);
          return;
        }

        handleEncryptedWallet(function(err) {
          if (err) {
            return setError(err);
          }

          ongoingProcess.set('signingTx', true);
          walletService.signTx(fc, txp, function(err, signedTxp) {
            ongoingProcess.set('signingTx', false);
            if (err) {
              return setError(err);
            }

            if (signedTxp.status == 'accepted') {
              ongoingProcess.set('broadcastingTx', true);
              walletService.broadcastTx(fc, signedTxp, function(err, broadcastedTxp) {
                ongoingProcess.set('broadcastingTx', false);
                $scope.$emit('UpdateTx');
                $scope.close(broadcastedTxp);
                if (err) {
                  return setError(err);
                }
              });
            } else {
              $scope.$emit('UpdateTx');
              $scope.close(signedTxp);
            }
          });
        });
      });
    }, 10);
  };

  function setError(err, prefix) {
    $scope.loading = false;
    $scope.error = bwcError.msg(err, prefix);
    $timeout(function() {
      $scope.$digest();
    }, 10);
  };

  $scope.$on('$destroy', function() {
    walletService.lock(fc);
  });

  $scope.reject = function(txp) {
    $scope.loading = true;
    $scope.error = null;

    $timeout(function() {
      ongoingProcess.set('rejectTx', true);
      walletService.rejectTx(fc, txp, function(err, txpr) {
        ongoingProcess.set('rejectTx', false);

        if (err) {
          $scope.$emit('UpdateTx');
          return setError(err, gettextCatalog.getString('Could not reject payment'));
        }

        $scope.close(txpr);
      });
    }, 10);
  };

  $scope.remove = function(txp) {
    $scope.loading = true;
    $scope.error = null;

    $timeout(function() {
      ongoingProcess.set('removeTx', true);
      walletService.removeTx(fc, txp, function(err) {
        ongoingProcess.set('removeTx', false);

        // Hacky: request tries to parse an empty response
        if (err && !(err.message && err.message.match(/Unexpected/))) {
          $scope.$emit('UpdateTx');
          return setError(err, gettextCatalog.getString('Could not delete payment proposal'));
        }

        $scope.close();
      });
    }, 10);
  };

  $scope.broadcast = function(txp) {
    $scope.loading = true;
    $scope.error = null;

    $timeout(function() {
      ongoingProcess.set('broadcastTx', true);
      walletService.broadcastTx(fc, txp, function(err, txpb) {
        ongoingProcess.set('broadcastTx', false);

        if (err) {
          return setError(err, gettextCatalog.getString('Could not broadcast payment'));
        }

        $scope.close(txpb);
      });
    }, 10);
  };

  $scope.getShortNetworkName = function() {
    return fc.credentials.networkName.substring(0, 4);
  };

  function checkPaypro() {
    if (tx.payProUrl && !platformInfo.isChromeApp) {
      fc.fetchPayPro({
        payProUrl: tx.payProUrl,
      }, function(err, paypro) {
        if (err) return;
        tx.paypro = paypro;
        paymentTimeControl(tx.paypro.expires);
        $timeout(function() {
          $ionicScrollDelegate.resize();
        }, 100);
      });
    }
  };

  function paymentTimeControl(expirationTime) {
    $scope.paymentExpired = false;
    setExpirationTime();

    self.countDown = $interval(function() {
      setExpirationTime();
    }, 1000);

    function setExpirationTime() {
      var now = Math.floor(Date.now() / 1000);
      if (now > expirationTime) {
        $scope.paymentExpired = true;
        if (self.countDown) $interval.cancel(self.countDown);
        return;
      }
      var totalSecs = expirationTime - now;
      var m = Math.floor(totalSecs / 60);
      var s = totalSecs % 60;
      $scope.expires = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    };
  };

  lodash.each(['TxProposalRejectedBy', 'TxProposalAcceptedBy', 'transactionProposalRemoved', 'TxProposalRemoved', 'NewOutgoingTx', 'UpdateTx'], function(eventName) {
    $rootScope.$on(eventName, function() {
      fc.getTx($scope.tx.id, function(err, tx) {
        if (err) {
          if (err.message && err.message == 'TX_NOT_FOUND' &&
            (eventName == 'transactionProposalRemoved' || eventName == 'TxProposalRemoved')) {
            $scope.tx.removed = true;
            $scope.tx.canBeRemoved = false;
            $scope.tx.pendingForUs = false;
            $scope.$apply();
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

  function handleEncryptedWallet(cb) {
    if (!walletService.isEncrypted(fc)) return cb();
    $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
      if (err) return cb(err);
      return cb(walletService.unlock(fc, password));
    });
  };

  $scope.copyToClipboard = function(addr, $event) {
    if (!addr) return;
    self.copyToClipboard(addr, $event);
  };

  $scope.close = function(txp) {
    $scope.loading = null;
    if (txp) {
      var type = txStatus.notify(txp);
      $scope.openStatusModal(type, txp, function() {
        $scope.$emit('Local/TxProposalAction', txp.status == 'broadcasted');
      });
    } else {
      $timeout(function() {
        $scope.$emit('Local/TxProposalAction');
      }, 100);
    }
    $scope.cancel();
  };

  $scope.openStatusModal = function(type, txp, cb) {
    $scope.type = type;
    $scope.tx = txFormatService.processTx(txp);
    $scope.cb = cb;

    $ionicModal.fromTemplateUrl('views/modals/tx-status.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.txStatusModal = modal;
      $scope.txStatusModal.show();
    });
  };

  $scope.cancel = function() {
    $scope.txpDetailsModal.hide();
  };
});
