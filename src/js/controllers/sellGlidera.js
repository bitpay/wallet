'use strict';

angular.module('copayApp.controllers').controller('sellGlideraController',
  function($scope, $timeout, $log, $modal, configService, profileService, addressService, feeService, glideraService, bwsError, lodash, isChromeApp, animationService, walletService, fingerprintService) {

    var self = this;
    var config = configService.getSync();
    this.data = {};
    this.show2faCodeInput = null;
    this.success = null;
    this.error = null;
    this.loading = null;
    var fc;

    window.ignoreMobilePause = true;

    var otherWallets = function(testnet) {
      var network = testnet ? 'testnet' : 'livenet';
      return lodash.filter(profileService.getWallets(network), function(w) {
        return w.network == network && w.m == 1;
      });
    };

    this.init = function(testnet) {
      self.otherWallets = otherWallets(testnet);
      // Choose focused wallet
      try {
        var currentWalletId = profileService.focusedClient.credentials.walletId;
        lodash.find(self.otherWallets, function(w) {
          if (w.id == currentWalletId) {
            $timeout(function() {
              self.selectedWalletId = w.id;
              self.selectedWalletName = w.name;
              fc = profileService.getClient(w.id);
              $scope.$apply();
            }, 100);
          }
        });
      } catch (e) {
        $log.debug(e);
      };
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;
      self.selectedWalletId = null;
      self.selectedWalletName = null;
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.type = 'SELL';
        $scope.wallets = wallets;
        $scope.noColor = true;
        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };

        $scope.selectWallet = function(walletId, walletName) {
          if (!profileService.getClient(walletId).isComplete()) {
            self.error = bwsError.msg({
              'code': 'WALLET_NOT_COMPLETE'
            }, 'Could not choose the wallet');
            $modalInstance.dismiss('cancel');
            return;
          }
          $modalInstance.close({
            'walletId': walletId,
            'walletName': walletName,
          });
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/wallets.html',
        windowClass: animationService.modalAnimated.slideUp,
        controller: ModalInstanceCtrl,
      });

      modalInstance.result.finally(function() {
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutDown);
      });

      modalInstance.result.then(function(obj) {
        $timeout(function() {
          self.selectedWalletId = obj.walletId;
          self.selectedWalletName = obj.walletName;
          fc = profileService.getClient(obj.walletId);
          $scope.$apply();
        }, 100);
      });
    };

    this.getSellPrice = function(token, price) {
      var self = this;
      this.error = null;
      if (!price || (price && !price.qty && !price.fiat)) {
        this.sellPrice = null;
        return;
      }
      this.gettingSellPrice = true;
      glideraService.sellPrice(token, price, function(err, sellPrice) {
        self.gettingSellPrice = false;
        if (err) {
          self.error = 'Could not get exchange information. Please, try again.';
        } else {
          self.error = null;
          self.sellPrice = sellPrice;
        }
      });
    };

    this.get2faCode = function(token) {
      var self = this;
      self.loading = 'Sending 2FA code...';
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          self.loading = null;
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
 
      addressService.getAddress(fc.credentials.walletId, null, function(err, refundAddress) {
        if (!refundAddress) {
          self.loading = null;
          self.error = bwsError.msg(err, 'Could not create address');
          return;
        }
        glideraService.getSellAddress(token, function(error, sellAddress) {
          if (!sellAddress) {
            self.loading = null;
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

          self.loading = 'Creating transaction...';
          walletService.createTx(txp, fc, function(err, createdTxp) {
            self.loading = null;
            if (err) {
              self.error = err.message || bwsError.msg(err);
              return;
            }
            $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
              if (accept) {
                fingerprintService.check(fc, config, function(err) {
                  if (err) {
                    self.error = err.message || bwsError.msg(err);
                    return;
                  }

                  profileService.unlockFC(fc, function(err) {
                    if (err) {
                      self.error = err.message || bwsError.msg(err);
                      return;
                    }

                    self.loading = 'Signing transaction...';

                    walletService.publishTx(createdTxp, fc, function(err, publishedTxp) {
                      if (err) {
                        self.loading = null;
                        self.error = err.message || bwsError.msg(err);
                      }

                      walletService.signTx(publishedTxp, fc, function(err, signedTxp) {
                        profileService.lockFC(fc);
                        walletService.removeTx(signedTxp, fc, function(err) {
                          if (err) $log.debug(err);
                        });
                        if (err) {
                          self.loading = null;
                          self.error = err.message || bwsError.msg(err);
                        } else {
                          var rawTx = signedTxp.raw;
                          var data = {
                            refundAddress: refundAddress,
                            signedTransaction: rawTx,
                            priceUuid: self.sellPrice.priceUuid,
                            useCurrentPrice: self.sellPrice.priceUuid ? false : true,
                            ip: null
                          };
                          self.loading = 'Selling bitcoin...';
                          glideraService.sell(token, twoFaCode, data, function(err, data) {
                            self.loading = null;
                            if (err) {
                              self.error = err.message || bwsError.msg(err);
                              $timeout(function() {
                                $scope.$emit('Local/GlideraError');
                              }, 100);
                            } else {
                              self.success = data;
                              $scope.$emit('Local/GlideraTx');
                            }
                          });
                        }
                      });
                    });
                  });
                });
              }
            });
          });
        });
      });
    };
  });
