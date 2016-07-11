'use strict';

angular.module('copayApp.controllers').controller('sellGlideraController',
  function($rootScope, $scope, $timeout, $ionicModal, $log, configService, profileService, addressService, feeService, glideraService, bwcError, lodash, walletService, fingerprintService, ongoingProcess, go) {

    var self = this;
    var config = configService.getSync();
    this.data = {};
    this.show2faCodeInput = null;
    this.success = null;
    this.error = null;
    var client;

    var handleEncryptedWallet = function(client, cb) {
      if (!walletService.isEncrypted(client)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    this.init = function(testnet) {
      self.allWallets = profileService.getWallets(testnet ? 'testnet' : 'livenet', 1);

      client = profileService.focusedClient;
      if (client && client.credentials.m == 1) {
        $timeout(function() {
          self.selectedWalletId = client.credentials.walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
      }
    };



    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'SELL';
      $scope.wallets = wallets;
      $scope.noColor = true;
      $scope.self = self;

      $ionicModal.fromTemplateUrl('views/modals/wallets.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.walletsModal = modal;
        $scope.walletsModal.show();
      });

      $scope.$on('walletSelected', function(ev, walletId) {
        $timeout(function() {
          client = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
      });
    };

    this.getSellPrice = function(token, price) {
      var self = this;
      self.error = null;
      if (!price || (price && !price.qty && !price.fiat)) {
        self.sellPrice = null;
        return;
      }
      self.gettingSellPrice = true;
      glideraService.sellPrice(token, price, function(err, sellPrice) {
        self.gettingSellPrice = false;
        if (err) {
          self.error = 'Could not get exchange information. Please, try again.';
          return;
        }
        self.sellPrice = sellPrice;
      });
    };

    this.get2faCode = function(token) {
      var self = this;
      ongoingProcess.set('Sending 2FA code...', true);
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          ongoingProcess.set('Sending 2FA code...', false);
          if (err) {
            self.error = 'Could not send confirmation code to your phone';
          } else {
            self.show2faCodeInput = sent;
          }
        });
      }, 100);
    };

    this.createTx = function(token, permissions, twoFaCode) {
      var self = this;
      self.error = null;
      var outputs = [];
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;

      if (!client) {
        self.error = 'No wallet selected';
        return;
      }

      ongoingProcess.set('creatingTx', true);
      addressService.getAddress(client.credentials.walletId, null, function(err, refundAddress) {
        if (!refundAddress) {

          ongoingProcess.clear();
          self.error = bwcError.msg(err, 'Could not create address');
          return;
        }
        glideraService.getSellAddress(token, function(error, sellAddress) {
          if (!sellAddress) {
            ongoingProcess.clear();
            self.error = 'Could not get the destination bitcoin address';
            return;
          }
          var amount = parseInt((self.sellPrice.qty * 100000000).toFixed(0));
          var comment = 'Glidera transaction';

          outputs.push({
            'toAddress': sellAddress,
            'amount': amount,
            'message': comment
          });

          var txp = {
            toAddress: sellAddress,
            amount: amount,
            outputs: outputs,
            message: comment,
            payProUrl: null,
            excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
            feeLevel: walletSettings.feeLevel || 'normal',
            customData: {
              'glideraToken': token
            }
          };

          walletService.createTx(client, txp, function(err, createdTxp) {
            ongoingProcess.clear();
            if (err) {
              self.error = err.message ||  bwcError.msg(err);
              return;
            }
            $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
              if (accept) {
                fingerprintService.check(client, function(err) {
                  if (err) {
                    self.error = err.message ||  bwcError.msg(err);
                    return;
                  }

                  handleEncryptedWallet(client, function(err) {
                    if (err) {
                      self.error = err.message ||  bwcError.msg(err);
                      return;
                    }

                    ongoingProcess.set('signingTx', true);
                    walletService.publishTx(client, createdTxp, function(err, publishedTxp) {
                      if (err) {
                        ongoingProcess.clear();
                        self.error = err.message ||  bwcError.msg(err);
                      }

                      walletService.signTx(client, publishedTxp, function(err, signedTxp) {
                        walletService.lock(client);
                        walletService.removeTx(client, signedTxp, function(err) {
                          if (err) $log.debug(err);
                        });
                        ongoingProcess.clear();
                        if (err) {
                          self.error = err.message ||  bwcError.msg(err);
                          return;
                        }
                        var rawTx = signedTxp.raw;
                        var data = {
                          refundAddress: refundAddress,
                          signedTransaction: rawTx,
                          priceUuid: self.sellPrice.priceUuid,
                          useCurrentPrice: self.sellPrice.priceUuid ? false : true,
                          ip: null
                        };
                        ongoingProcess.set('Seling Bitcoin', true);
                        glideraService.sell(token, twoFaCode, data, function(err, data) {
                          ongoingProcess.clear();
                          if (err) {
                            self.error = err.message ||  bwcError.msg(err);
                            $timeout(function() {
                              $scope.$emit('Local/GlideraError');
                            }, 100);
                            return;
                          }
                          self.success = data;
                          $scope.$emit('Local/GlideraTx');
                        });
                      });
                    });
                  });
                });
              } else {
                go.path('glidera');
              }
            });
          });
        });
      });
    };
  });
