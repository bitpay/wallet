'use strict';

angular.module('copayApp.controllers').controller('sellGlideraController',
  function($rootScope, $scope, $timeout, $ionicModal, $log, profileService, glideraService, bwcError, lodash, walletService, fingerprintService, configService, ongoingProcess) {

    var self = this;
    this.data = {};
    this.show2faCodeInput = null;
    this.success = null;
    this.error = null;
    var wallet;

    var handleEncryptedWallet = function(wallet, cb) {
      if (!walletService.isEncrypted(wallet)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(wallet, password));
      });
    };

    $scope.init = function(accessToken) {
      $scope.network = glideraService.getEnvironment();

      $scope.token = accessToken;
      $scope.error = null;
      $scope.permissions = null;
      $scope.email = null;
      $scope.personalInfo = null;
      $scope.txs = null;
      $scope.status = null;
      $scope.limits = null;

      ongoingProcess.set('connectingGlidera', true);
      glideraService.init($scope.token, function(err, glidera) {
        ongoingProcess.set('connectingGlidera');
        if (err || !glidera) {
          $scope.error = err;
          return;
        }
        $scope.token = glidera.token;
        $scope.permissions = glidera.permissions;
        $scope.update({fullUpdate: true});
      });

      self.allWallets = profileService.getWallets({
        network: $scope.network,
        n: 1,
        onlyComplete: true
      });
      if (lodash.isEmpty(self.allWallets)) return;

      wallet = self.allWallets[0];
      if (wallet) {
        $timeout(function() {
          self.selectedWalletId = wallet.credentials.walletId;
          self.selectedWalletName = wallet.credentials.walletName;
          $scope.$apply();
        }, 100);
      }
    };

    $scope.update = function(opts) {
      if (!$scope.token || !$scope.permissions) return;
      $log.debug('Updating Glidera Account...');
      var accessToken = $scope.token;
      var permissions = $scope.permissions;

      opts = opts || {};

      glideraService.getStatus(accessToken, function(err, data) {
        $scope.status = data;
      });

      glideraService.getLimits(accessToken, function(err, limits) {
        $scope.limits = limits;
      });

      if (permissions.transaction_history) {
        glideraService.getTransactions(accessToken, function(err, data) {
          $scope.txs = data;
        });
      }

      if (permissions.view_email_address && opts.fullUpdate) {
        glideraService.getEmail(accessToken, function(err, data) {
          $scope.email = data.email;
        });
      }
      if (permissions.personal_info && opts.fullUpdate) {
        glideraService.getPersonalInfo(accessToken, function(err, data) {
          $scope.personalInfo = data;
        });
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
          wallet = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = wallet.credentials.walletName;
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
      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;

      if (!wallet) {
        self.error = 'No wallet selected';
        return;
      }

      ongoingProcess.set('creatingTx', true);
      walletService.getAddress(wallet, null, function(err, refundAddress) {
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

          walletService.createTx(wallet, txp, function(err, createdTxp) {
            ongoingProcess.clear();
            if (err) {
              self.error = err.message ||  bwcError.msg(err);
              return;
            }
            fingerprintService.check(wallet, function(err) {
              if (err) {
                self.error = err.message ||  bwcError.msg(err);
                return;
              }

              walletService.handleEncryptedWallet(wallet, function(err) {
                if (err) {
                  self.error = err.message ||  bwcError.msg(err);
                  return;
                }

                ongoingProcess.set('signingTx', true);
                walletService.publishTx(wallet, createdTxp, function(err, publishedTxp) {
                  if (err) {
                    ongoingProcess.clear();
                    self.error = err.message ||  bwcError.msg(err);
                  }

                  walletService.signTx(wallet, publishedTxp, function(err, signedTxp) {
                    walletService.lock(wallet);
                    walletService.removeTx(wallet, signedTxp, function(err) {
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
                        return;
                      }
                      self.success = data;
                      $scope.update();
                    });
                  });
                });
              });
            });
          });
        });
      });
    };
  });
