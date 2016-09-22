angular.module('copayApp.controllers').controller('paperWalletController',
  function($scope, $timeout, $log, $ionicModal, $ionicHistory, popupService, gettextCatalog, platformInfo, configService, profileService, $state, bitcore, ongoingProcess, txFormatService, $stateParams, walletService) {

    $scope.onQrCodeScanned = function(data) {
      $scope.formData.inputData = data;
      $scope.onData(data);
    };

    $scope.onData = function(data) {
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

      ongoingProcess.set('scanning', true);
      $timeout(function() {
        _scanFunds(function(err, privateKey, balance) {
          ongoingProcess.set('scanning', false);
          if (err) {
            $log.error(err);
            popupService.showAlert(gettextCatalog.getString('Error scanning funds:'), err || err.toString());
          } else {
            $scope.privateKey = privateKey;
            $scope.balanceSat = balance;
            var config = configService.getSync().wallet.settings;
            $scope.balance = txFormatService.formatAmount(balance) + ' ' + config.unitName;
            $scope.scanned = true;
          }

          $scope.$apply();
        });
      }, 100);
    };

    function _sweepWallet(cb) {
      walletService.getAddress(wallet, true, function(err, destinationAddress) {
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

      $timeout(function() {
        _sweepWallet(function(err, destinationAddress, txid) {
          ongoingProcess.set('sweepingWallet', false);
          $scope.sending = false;
          if (err) {
            $log.error(err);
            popupService.showAlert(gettextCatalog.getString('Error sweeping wallet:'), err || err.toString());
          } else {
            $scope.openStatusModal('broadcasted', function() {
              $ionicHistory.clearHistory();
              $state.go('tabs.home');
            });
          }
          $scope.$apply();
        });
      }, 100);
    };

    $scope.openStatusModal = function(type, cb) {
      $scope.tx = {};
      $scope.tx.amountStr = $scope.balance;
      $scope.type = type;
      $scope.color = wallet.backgroundColor;
      $scope.cb = cb;

      $ionicModal.fromTemplateUrl('views/modals/tx-status.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.txStatusModal = modal;
        $scope.txStatusModal.show();
      });
    };

    $scope.$on("$ionicView.enter", function(event, data){
      var wallet = profileService.getWallet($stateParams.walletId);
      $scope.wallet = wallet;
      $scope.isCordova = platformInfo.isCordova;
      $scope.needsBackup = wallet.needsBackup;
      $scope.walletAlias = wallet.name;
      $scope.walletName = wallet.credentials.walletName;
      $scope.formData = {};
      $scope.formData.inputData = null;
      $scope.scannedKey = null;
      $scope.balance = null;
      $scope.balanceSat = null;
      $scope.scanned = false;
      $timeout(function() {
        $scope.$apply();
      }, 10);
    });
  });
