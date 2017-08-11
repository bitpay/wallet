angular.module('copayApp.controllers').controller('paperWalletController',
  function($scope, $timeout, $log, $ionicModal, $ionicHistory, feeService, popupService, gettextCatalog, platformInfo, configService, profileService, $state, ongoingProcess, txFormatService, $stateParams, walletService, networkService) {

    function _scanFunds(cb) {
      function getPrivateKey(scannedKey, isPkEncrypted, passphrase, cb) {
        if (!isPkEncrypted) return cb(null, scannedKey);
        $scope.wallet.decryptBIP38PrivateKey(scannedKey, passphrase, null, cb);
      };

      function getBalance(privateKey, cb) {
        $scope.wallet.getBalanceFromPrivateKey(privateKey, cb);
      };

      function checkPrivateKey(privateKey) {
        try {
          networkService.bwcFor('livenet/btc').getBitcore().PrivateKey(privateKey, 'livenet/btc'); // TODO: support other than livenet/btc
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
      ongoingProcess.set('scanning', true);
      $timeout(function() {
        _scanFunds(function(err, privateKey, balance) {
          ongoingProcess.set('scanning', false);
          if (err) {
            $log.error(err);
            popupService.showAlert(gettextCatalog.getString('Error scanning funds:'), err || err.toString());
            $state.go('tabs.home');
          } else {
            $scope.privateKey = privateKey;
            $scope.balanceAtomic = balance;
            if ($scope.balanceAtomic <= 0)
              popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Not funds found'));
            var config = configService.getSync().wallet.settings;
            $scope.balance = txFormatService.formatAmount('livenet/btc', balance) + ' ' + config.unitName; // TODO: support other than livenet/btc
          }
          $scope.$apply();
        });
      }, 100);
    };

    function _sweepWallet(cb) {
      walletService.getAddress($scope.wallet, true, function(err, destinationAddress) {
        if (err) return cb(err);

        $scope.wallet.buildTxFromPrivateKey($scope.privateKey, destinationAddress, null, function(err, testTx) {
          if (err) return cb(err);
          var rawTxLength = testTx.serialize().length;
          feeService.getCurrentFeeRate('livenet/btc', function(err, feePerKB) { // TODO: support other than livenet/btc
            var opts = {};
            opts.fee = Math.round((feePerKB * rawTxLength) / 2000);
            $scope.wallet.buildTxFromPrivateKey($scope.privateKey, destinationAddress, opts, function(err, tx) {
              if (err) return cb(err);
              $scope.wallet.broadcastRawTx({
                rawTx: tx.serialize(),
                network: 'livenet/btc'
              }, function(err, txid) {
                if (err) return cb(err);
                return cb(null, destinationAddress, txid);
              });
            });
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
            $scope.sendStatus = 'success';
          }
          $scope.$apply();
        });
      }, 100);
    };

    $scope.onSuccessConfirm = function() {
      $state.go('tabs.home');
    };

    $scope.onWalletSelect = function(wallet) {
      $scope.wallet = wallet;
    };

    $scope.showWalletSelector = function() {
      if ($scope.singleWallet) return;
      $scope.walletSelectorTitle = gettextCatalog.getString('Transfer to');
      $scope.showWallets = true;
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.scannedKey = (data.stateParams && data.stateParams.privateKey) ? data.stateParams.privateKey : null;
      $scope.isPkEncrypted = $scope.scannedKey ? ($scope.scannedKey.substring(0, 2) == '6P') : null;
      $scope.sendStatus = null;
      $scope.error = false;

      $scope.wallets = profileService.getWallets({
        onlyComplete: true,
        network: 'livenet/btc', // TODO: support other than livenet/btc
      });
      $scope.singleWallet = $scope.wallets.length == 1;

      if (!$scope.wallets || !$scope.wallets.length) {
        $scope.noMatchingWallet = true;
        return;
      }
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      $scope.wallet = $scope.wallets[0];
      if (!$scope.wallet) return;
      if (!$scope.isPkEncrypted) $scope.scanFunds();
      else {
        var message = gettextCatalog.getString('Private key encrypted. Enter password');
        popupService.showPrompt(null, message, null, function(res) {
          $scope.passphrase = res;
          $scope.scanFunds();
        });
      }
    });

  });
