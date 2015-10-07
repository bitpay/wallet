angular.module('copayApp.controllers').controller('paperWalletController',
  function($scope, $http, $timeout, $log, configService, profileService, go, addressService, bitcore) {
    self = this;
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

    self.scanFunds = function() {
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

      self.scanning = true;
      self.privateKey = '';
      self.error = '';
      $timeout(function() {
        getPrivateKey(self.scannedKey, self.isPkEncrypted, $scope.passphrase, function(err, privateKey) {
          if (err) {
            $log.error(err);
            self.error = 'Could not get private key';
            self.scanning = false;
            return;
          }
          if (!checkPrivateKey(privateKey)) {
            self.error = 'Invalid private key';
            self.scanning = false;
            return;
          }
          self.privateKey = privateKey;

          getBalance(privateKey, function(err, balance) {
            self.scanning = false;
            if (err) {
              $log.error(err);
              self.error = 'Could not get balance';
              self.scanning = false;
              return;
            }
            var config = configService.getSync().wallet.settings;
            self.balance = profileService.formatAmount(balance) + ' ' + config.unitName;
            $timeout(function() {
              $scope.$apply();
            }, 1);
          });
        });
      }, 100);
    }

    self.sweepWallet = function() {
      self.sending = true;
      self.error = '';
      $timeout(function() {
        addressService.getAddress(fc.credentials.walletId, true, function(err, destinationAddress) {
          if (err) {
            $log.error(err);
            self.error = 'Could not get destination address';
            self.sending = false;
            return;
          }

          fc.buildTxFromPrivateKey(self.privateKey, destinationAddress, null, function(err, tx) {
            if (err) {
              $log.error(err);
              self.error = 'Could not build transaction';
              self.sending = false;
              return;
            }

            fc.broadcastRawTx({
              rawTx: tx.serialize(),
              network: 'livenet'
            }, function(err, txid) {
              if (err) {
                $log.error(err);
                self.error = 'Could not broadcast transaction';
                self.sending = false;
                return;
              }

              $timeout(function() {
                $scope.$apply();
              }, 1);
              go.walletHome();
            });
          });
        });
      }, 100);
    };
  });
