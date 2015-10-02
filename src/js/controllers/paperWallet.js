angular.module('copayApp.controllers').controller('paperWalletController',
  function($scope, $http, $timeout, configService, profileService, go, addressService, bitcore) {
    self = this;
    var fc = profileService.focusedClient;
    var rawTx;

    self.onQrCodeScanned = function(data) {
      $scope.privateKey = data;
    }

    self.createTx = function(privateKey, passphrase) {
      if (privateKey.charAt(0) != '6') {
        var isValidKey = self.checkPrivateKey(privateKey);

        if (!isValidKey) return;
      }

      var config = configService.getSync().wallet.settings;
      self.error = null;
      self.scanning = true;
      $timeout(function() {
        self.getRawTx(privateKey, passphrase, function(err, rawtx, utxos) {
          self.scanning = false;

          if (err)
            self.error = err.toString();
          else {
            self.balance = profileService.formatAmount(utxos) + ' ' + config.unitName;
            rawTx = rawtx;
          }

          $timeout(function() {
            $scope.$apply();
          }, 1);
        });
      }, 100);
    };

    self.checkPrivateKey = function(privateKey) {
      try {
        new bitcore.PrivateKey(privateKey, 'livenet');
      } catch (err) {
        self.error = err.toString();
        return false;
      }
      return true;
    }

    self.getRawTx = function(privateKey, passphrase, cb) {
      if (privateKey.charAt(0) == 6) {
        fc.decryptBIP38PrivateKey(privateKey, passphrase, null, function(err, privateKey) {
          if (err) return cb(err);

          fc.getBalanceFromPrivateKey(privateKey, function(err, utxos) {
            if (err) return cb(err);

            addressService.getAddress(fc.credentials.walletId, true, function(err, destinationAddress) {
              if (err) return cb(err);

              fc.buildTxFromPrivateKey(privateKey, destinationAddress, null, function(err, tx) {
                if (err) return cb(err);
                return cb(null, tx.serialize(), utxos);
              });
            });
          });
        });
      } else {
        fc.getBalanceFromPrivateKey(privateKey, function(err, utxos) {
          if (err) return cb(err)

          addressService.getAddress(fc.credentials.walletId, true, function(err, destinationAddress) {
            if (err) return cb(err);

            fc.buildTxFromPrivateKey(privateKey, destinationAddress, null, function(err, tx) {
              if (err) return cb(err);
              return cb(null, tx.serialize(), utxos);
            });
          });
        });
      }
    };

    self.transaction = function() {
      self.error = null;
      self.sending = true;
      $timeout(function() {
        self.doTransaction(rawTx).then(function(err, response) {
            self.sending = false;
            self.goHome();
          },
          function(err) {
            self.sending = false;
            self.error = err.toString();
            $timeout(function() {
              $scope.$apply();
            }, 1);
          });
      }, 100);
    };

    self.goHome = function() {
      go.walletHome();
    };

    self.doTransaction = function(rawTx) {
      return $http.post('https://insight.bitpay.com/api/tx/send', {
        rawtx: rawTx
      });
    };
  });
