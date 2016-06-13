angular.module('copayApp.controllers').controller('paperWalletController',
  function($scope, $http, $timeout, $log, configService, profileService, go, addressService, txStatus, bitcore, ongoingProcess) {
    var self = this;
    var fc = profileService.focusedClient;
    var rawTx;

    self.onQrCodeScanned = function(data) {
      $scope.inputData = data;
      self.onData(data);
    }

    self.onData = function(data) {
      self.error = '';
      self.scannedKey = data;
      self.isPkEncrypted = (data.substring(0,2) == '6P');
    }

    self._scanFunds = function(cb) {
      function getPrivateKey(scannedKey, isPkEncrypted, passphrase, cb) {
        if (!isPkEncrypted) return cb(null, scannedKey);
        fc.decryptBIP38PrivateKey(scannedKey, passphrase, null, cb);
      };

      function getBalance(privateKey, cb) {
        fc.getBalanceFromPrivateKey(privateKey, cb);
      };

      function checkPrivateKey(privateKey) {
        try {
          new bitcore.PrivateKey(privateKey, 'livenet');
        } catch (err) {
          return false;
        }
        return true;
      }

      getPrivateKey(self.scannedKey, self.isPkEncrypted, $scope.passphrase, function(err, privateKey) {
        if (err) return cb(err);
        if (!checkPrivateKey(privateKey)) return cb(new Error('Invalid private key'));

        getBalance(privateKey, function(err, balance) {
          if (err) return cb(err);
          return cb(null, privateKey, balance);
        });
      });
    }

    self.scanFunds = function() {
      self.privateKey = '';
      self.balanceSat = 0;
      self.error = '';

      ongoingProcess.set('scanning', true);
      $timeout(function() {
        self._scanFunds(function(err, privateKey, balance) {
          ongoingProcess.set('scanning', false);
          if (err) {
            $log.error(err);
            self.error = err.message || err.toString();
          } else {
            self.privateKey = privateKey;
            self.balanceSat = balance;
            var config = configService.getSync().wallet.settings;
            self.balance = profileService.formatAmount(balance) + ' ' + config.unitName;
          }

          $scope.$apply();
        });
      }, 100);
    }

    self._sweepWallet = function(cb) {
      addressService.getAddress(fc.credentials.walletId, true, function(err, destinationAddress) {
        if (err) return cb(err);

        fc.buildTxFromPrivateKey(self.privateKey, destinationAddress, null, function(err, tx) {
          if (err) return cb(err);

          fc.broadcastRawTx({
            rawTx: tx.serialize(),
            network: 'livenet'
          }, function(err, txid) {
            if (err) return cb(err);
            return cb(null, destinationAddress, txid);
          });
        });
      });
    };

    self.sweepWallet = function() {
      ongoingProcess.set('sweepingWallet', true);
      self.sending = true;
      self.error = '';

      $timeout(function() {
        self._sweepWallet(function(err, destinationAddress, txid) {
          ongoingProcess.set('sweepingWallet', false);

          if (err) {
            self.error = err.message || err.toString();
            $log.error(err);
          } else {
            txStatus.notify({
              status: 'broadcasted'
            }, function() {
              go.walletHome();
            });
          }

          $scope.$apply();
        });
      }, 100);
    }
  });
