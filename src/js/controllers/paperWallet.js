angular.module('copayApp.controllers').controller('paperWalletController',
  function($scope, $http, profileService, addressService) {

    self = this;
    var fc = profileService.focusedClient;
    var rawTx;

    self.onQrCodeScanned = function(data) {
      $scope.privateKey = data;
      console.log(data);
    }

    self.createTx = function(privateKey, passphrase) {
      console.log("entro");
      console.log(privateKey);
      console.log(passphrase);
      if (!privateKey) self.error = "Enter privateKey or scann for one";
      this.getRawTx(privateKey, passphrase, function(err, rawTx, utxos) {
        console.log(utxos);
        console.log("creada");
        if (err) self.error = err.toString();
        else {
          self.balance = (utxos / 1e8).toFixed(8);
          rawTx = rawTx;
        }
      });
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
                console.log(tx.serialize());
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
              console.log(tx.serialize());
              return cb(null, tx.serialize(), utxos);
            });
          });
        });
      }
    };

    self.transaction = function() {

      self.doTransaction(rawTx).then(function(response) {
          console.log(response); //mostrar pantalla de sent successfully
        },
        function(err) {
          self.error = err;
          console.log(err); //mostrar mensaje de error en la pantalla
        });
    };

    self.doTransaction = function(rawTx) {
      return $http.post('https://insight.bitpay.com/api/tx/send', {
        rawtx: rawTx
      });
    };

  });