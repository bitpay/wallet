'use strict';

angular.module('copayApp.controllers').controller('txpDetailsController', function($scope, $rootScope, $timeout, $interval, $ionicModal, ongoingProcess, platformInfo, $ionicScrollDelegate, txFormatService, fingerprintService, bwcError, gettextCatalog, lodash,  walletService, popupService) {
  var self = $scope.self;
  var tx = $scope.tx;
  var copayers = $scope.copayers;
  var isGlidera = $scope.isGlidera;
  var now = Math.floor(Date.now() / 1000);
  $scope.loading = null;


  $scope.copayerId = $scope.wallet.credentials.copayerId;
  $scope.isShared =  $scope.wallet.credentials.n > 1;
  $scope.canSign =  $scope.wallet.canSign() ||  $scope.wallet.isPrivKeyExternal();
  $scope.color =  $scope.wallet.color;

  checkPaypro();

  // ToDo: use tx.customData instead of tx.message
  if (tx.message === 'Glidera transaction' && isGlidera) {
    tx.isGlidera = true;
    if (tx.canBeRemoved) {
      tx.canBeRemoved = (Date.now() / 1000 - (tx.ts || tx.createdOn)) > GLIDERA_LOCK_TIME;
    }
  }

  var setSendError = function(msg) {
    var error = msg || gettextCatalog.getString('Could not send payment');
    popupService.showAlert(gettextCatalog.getString('Error'), error);
  }

  $scope.sign = function() {
    $scope.loading = true;
    walletService.publishAndSign($scope.wallet, $scope.tx, function(err, txp) {
        $scope.$emit('UpdateTx');
        if (err) return setSendError(err);
        $scope.close();
    });
  };

  function setError(err, prefix) {
    $scope.loading = false;
    popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err, prefix));
  };

  $scope.reject = function(txp) {
    $scope.loading = true;

    walletService.reject($scope.wallet, $scope.tx, function(err, txpr) {
      if (err)
        return setError(err, gettextCatalog.getString('Could not reject payment'));

      $scope.close();
    });


  };

  $scope.remove = function() {
    $scope.loading = true;

    $timeout(function() {
      ongoingProcess.set('removeTx', true);
      walletService.removeTx($scope.wallet, $scope.tx, function(err) {
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

    $timeout(function() {
      ongoingProcess.set('broadcastTx', true);
      walletService.broadcastTx($scope.wallet, $scope.tx, function(err, txpb) {
        ongoingProcess.set('broadcastTx', false);

        if (err) {
          return setError(err, gettextCatalog.getString('Could not broadcast payment'));
        }

        $scope.close();
      });
    }, 10);
  };

  $scope.getShortNetworkName = function() {
    return $scope.wallet.credentials.networkName.substring(0, 4);
  };

  function checkPaypro() {
    if (tx.payProUrl && !platformInfo.isChromeApp) {
      $scope.wallet.fetchPayPro({
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
      $scope.wallet.getTx($scope.tx.id, function(err, tx) {
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
          copayerId: $scope.wallet.credentials.copayerId
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

  $scope.close = function() {
    $scope.loading = null;
    $scope.txpDetailsModal.hide();
  };
});
