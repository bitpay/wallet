angular.module('copayApp.controllers').controller('paperWalletController',
  function($scope, $timeout, $log, $ionicModal, configService, profileService, $state, addressService, txStatus, bitcore, ongoingProcess, txFormatService, $stateParams) {

    var wallet = profileService.getWallet($stateParams.walletId);
    var rawTx;

    $scope.onQrCodeScanned = function(data) {
      $scope.inputData = data;
      $scope.onData(data);
    };

    $scope.onData = function(data) {
      $scope.error = null;
      $scope.scannedKey = data;
      $scope.isPkEncrypted = (data.substring(0, 2) == '6P');
    };

    function _scanFunds(cb) {
      function getPrivateKey(scannedKey, isPkEncrypted, passphrase, cb) {
        if (!isPkEncrypted) return cb(null, scannedKey);
        wallet.decryptBIP38PrivateKey(scannedKey, passphrase, null, cb);
      };

      function getBalance(privateKey, cb) {
        wallet.getBalanceFromPrivateKey(privateKey, cb);
      };

      function checkPrivateKey(privateKey) {
        try {
          new bitcore.PrivateKey(privateKey, 'livenet');
        } catch (err) {
          return false;
        }
        return true;
      };

      getPrivateKey($scope.scannedKey, $scope.isPkEncrypted, $scope.passphrase, function(err, privateKey) {
        if (err) return cb(err);
        if (!checkPrivateKey(privateKey)) return cb(new Error('Invalid private key'));

        getBalance(privateKey, function(err, balance) {
          if (err) return cb(err);
          return cb(null, privateKey, balance);
        });
      });
    };

    $scope.scanFunds = function() {
      $scope.privateKey = '';
      $scope.balanceSat = 0;
      $scope.error = null;

      ongoingProcess.set('scanning', true);
      $timeout(function() {
        _scanFunds(function(err, privateKey, balance) {
          ongoingProcess.set('scanning', false);
          if (err) {
            $log.error(err);
            $scope.error = err.message || err.toString();
          } else {
            $scope.privateKey = privateKey;
            $scope.balanceSat = balance;
            var config = configService.getSync().wallet.settings;
            $scope.balance = txFormatService.formatAmount(balance) + ' ' + config.unitName;
          }

          $scope.$apply();
        });
      }, 100);
    };

    function _sweepWallet(cb) {
      addressService.getAddress(wallet.credentials.walletId, true, function(err, destinationAddress) {
        if (err) return cb(err);

        wallet.buildTxFromPrivateKey($scope.privateKey, destinationAddress, null, function(err, tx) {
          if (err) return cb(err);

          wallet.broadcastRawTx({
            rawTx: tx.serialize(),
            network: 'livenet'
          }, function(err, txid) {
            if (err) return cb(err);
            return cb(null, destinationAddress, txid);
          });
        });
      });
    };

    $scope.sweepWallet = function() {
      ongoingProcess.set('sweepingWallet', true);
      $scope.sending = true;
      $scope.error = null;

      $timeout(function() {
        _sweepWallet(function(err, destinationAddress, txid) {
          ongoingProcess.set('sweepingWallet', false);

          if (err) {
            $scope.error = err.message || err.toString();
            $log.error(err);
          } else {
            var type = txStatus.notify(txp);
            $scope.openStatusModal(type, txp, function() {
              $state.go('tabs.home');
            });
          }
          $scope.$apply();
        });
      }, 100);
    };

    $scope.openStatusModal = function(type, txp, cb) {
      $scope.type = type;
      $scope.tx = txFormatService.processTx(txp);
      $scope.color = wallet.backgroundColor;
      $scope.cb = cb;

      $ionicModal.fromTemplateUrl('views/modals/tx-status.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.txStatusModal = modal;
        $scope.txStatusModal.show();
      });
    };

  });
