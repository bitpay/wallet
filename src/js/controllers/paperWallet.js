angular.module('copayApp.controllers').controller('paperWalletController',
  function($scope, $http, $timeout, $rootScope, profileService, go, addressService, isCordova, gettext) {
    self = this;
    var fc = profileService.focusedClient;
    var rawTx;
    if (isCordova) self.message = "Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open."

    self.onQrCodeScanned = function(data) {
      $scope.privateKey = data;
    }

    self.createTx = function(privateKey, passphrase) {
      self.error = null;
      self.scanning = true;

      $timeout(function() {
        self.getRawTx(privateKey, passphrase, function(err, rawtx, utxos) {
          self.scanning = false;

          if (err)
            self.error = err.toString();
          else {
            self.balance = (utxos / 1e8).toFixed(8);
            rawTx = rawtx;
          }

          $timeout(function() {
            $scope.$apply();
          }, 1);

        });
      }, 100);
    };

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
      self.doTransaction(rawTx).then(function(err, response) {
          self.goHome();
        },
        function(err) {
          self.error = err.toString();
        });
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