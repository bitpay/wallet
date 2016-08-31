'use strict';

angular.module('copayApp.controllers').controller('sellGlideraController',
  function($scope, $timeout, $log, profileService, glideraService, bwcError, lodash, walletService, configService, ongoingProcess, popupService, gettextCatalog) {

    var self = this;
    this.data = {};
    this.show2faCodeInput = null;
    this.success = null;
    var wallet;

    $scope.$on('Wallet/Changed', function(event, w) {
      if (lodash.isEmpty(w)) {
        $log.debug('No wallet provided');
        return;
      }
      wallet = w;
      $log.debug('Wallet changed: ' + w.name);
    });

    $scope.init = function(accessToken) {
      $scope.network = glideraService.getEnvironment();

      $scope.token = accessToken;
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
          if (err) popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $scope.token = glidera.token;
        $scope.permissions = glidera.permissions;
        $scope.update({fullUpdate: true});
      });

      $scope.wallets = profileService.getWallets({
        network: $scope.network,
        n: 1,
        onlyComplete: true
      });
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

    this.getSellPrice = function(token, price) {
      var self = this;
      if (!price || (price && !price.qty && !price.fiat)) {
        self.sellPrice = null;
        return;
      }
      self.gettingSellPrice = true;
      glideraService.sellPrice(token, price, function(err, sellPrice) {
        self.gettingSellPrice = false;
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not get exchange information. Please, try again'));
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
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not send confirmation code to your phone'));
          } else {
            self.show2faCodeInput = sent;
          }
        });
      }, 100);
    };

    this.createTx = function(token, permissions, twoFaCode) {
      var self = this;
      var outputs = [];
      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;

      if (!wallet) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('No wallet selected'));
        return;
      }

      ongoingProcess.set('creatingTx', true);
      walletService.getAddress(wallet, null, function(err, refundAddress) {
        if (!refundAddress) {
          ongoingProcess.clear();
          popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err, 'Could not create address'));
          return;
        }
        glideraService.getSellAddress(token, function(err, sellAddress) {
          if (!sellAddress || err) {
            ongoingProcess.clear();
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not get the destination bitcoin address'));
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
              popupService.showAlert(gettextCatalog.getString('Error'), err.message || bwcError.msg(err));
              return;
            }
            walletService.prepare(wallet, function(err, password) {
              if (err) {
                ongoingProcess.clear();
                popupService.showAlert(gettextCatalog.getString('Error'), err.message || bwcError.msg(err));
                return;
              }
              ongoingProcess.set('signingTx', true);
              walletService.publishTx(wallet, createdTxp, function(err, publishedTxp) {
                if (err) {
                  ongoingProcess.clear();
                  popupService.showAlert(gettextCatalog.getString('Error'), err.message || bwcError.msg(err));
                  return;
                }

                walletService.signTx(wallet, publishedTxp, password, function(err, signedTxp) {
                  if (err) {
                    ongoingProcess.clear();
                    popupService.showAlert(gettextCatalog.getString('Error'), err.message || bwcError.msg(err));
                    walletService.removeTx(wallet, signedTxp, function(err) {
                      if (err) $log.debug(err);
                    });
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
                  ongoingProcess.set('Selling Bitcoin', true);
                  glideraService.sell(token, twoFaCode, data, function(err, data) {
                    ongoingProcess.clear();
                    if (err) {
                      popupService.showAlert(gettextCatalog.getString('Error'), err.message || bwcError.msg(err));
                      return;
                    }
                    self.success = data;
                    $timeout(function() {
                      $scope.$digest();
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
