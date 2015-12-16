angular.module('copayApp.controllers').controller('paperWalletController',
  function($scope, $http, $timeout, $log, configService, profileService, go, addressService, txStatus, bitcore) {
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
      self.isPkEncrypted = (data.charAt(0) == '6');
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
      self.scanning = true;
      self.privateKey = '';
      self.balanceSat = 0;
      self.error = '';

      $timeout(function() {
        self._scanFunds(function(err, privateKey, balance) {
          self.scanning = false;
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
      self.sending = true;
      self.error = '';

      $timeout(function() {
        self._sweepWallet(function(err, destinationAddress, txid) {
          self.sending = false;

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
