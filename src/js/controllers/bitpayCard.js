'use strict';

angular.module('copayApp.controllers').controller('bitpayCardController', function($scope, $rootScope, $timeout, $log, $ionicModal, lodash, bitpayCardService, configService, profileService, walletService, fingerprintService, ongoingProcess, bwcError, bitcore, pbkdf2Service, moment, platformInfo) {

  var self = this;
  var client;

  var network = 'livenet';
  self.sandbox = network == 'testnet' ? true : false;

  if (platformInfo.isCordova && StatusBar.isVisible) {
    StatusBar.backgroundColorByHexString("#293C92");
  }

  var handleEncryptedWallet = function(client, cb) {
    if (!walletService.isEncrypted(client)) return cb();
    $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
      if (err) return cb(err);
      return cb(walletService.unlock(client, password));
    });
  };

  var processTransactions = function(invoices, history) {
    for (var i = 0; i < invoices.length; i++) {
      var matched = false;
      for (var j = 0; j < history.length; j++) {
        if (history[j].description[0].indexOf(invoices[i].id) > -1) {
          matched = true;
        }
      }
      if (!matched && ['paid', 'confirmed', 'complete'].indexOf(invoices[i].status) > -1) {

        history.unshift({
          timestamp: invoices[i].invoiceTime,
          description: invoices[i].itemDesc,
          amount: invoices[i].price,
          type: '00611 = Client Funded Deposit',
          pending: true,
          status: invoices[i].status
        });
      }
    }
    return history;
  };

  var setDateRange = function(preset) {
    var startDate, endDate;
    preset = preset || 'last30Days';
    switch(preset) {
      case 'last30Days':
        startDate = moment().subtract(30, 'days').toISOString();
        endDate = moment().toISOString();
        break;
      case 'lastMonth':
        startDate = moment().startOf('month').subtract(1, 'month').toISOString();
        endDate = moment().startOf('month').toISOString();
        break;
      case 'all':
        startDate = null;
        endDate = null;
        break;
      default:
        return;
    }
    return {
      startDate: startDate,
      endDate: endDate
    };
  };

  this.update = function() {
    var dateRange = setDateRange($scope.dateRange);
    self.loadingSession = true;
    bitpayCardService.setCredentials(network);
    bitpayCardService.isAuthenticated(function(err, bpSession) {
      self.loadingSession = false;
      if (err) {
        self.error = err.data.error || 'Incorrect email or password';
        return;
      }

      self.bitpayCardAuthenticated = bpSession.isAuthenticated;
      self.bitpayCardTwoFactorPending = bpSession.twoFactorPending ? true : false;

      if (self.bitpayCardTwoFactorPending) return;

      if (self.bitpayCardAuthenticated) {
        $scope.loadingHistory = true;
        bitpayCardService.invoiceHistory(function(err, invoices) {
          if (err) $log.error(err);
          bitpayCardService.transactionHistory(dateRange, function(err, history) {
            $scope.loadingHistory = false;
            if (err) {
              self.error = err;
              return;
            }

            self.bitpayCardTransactionHistory = processTransactions(invoices, history.transactionList);
            self.bitpayCardCurrentBalance = history.currentCardBalance;
          });
        });
      }
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  this.init = function() {
    $scope.dateRange = 'last30Days';
    self.update();

    self.allWallets = profileService.getWallets(network);
    client = profileService.focusedClient;

    if (!client) return;

    if (lodash.isEmpty(self.allWallets)) return;

    if (client.credentials.network != network) return;

    if (client.credentials.n > 1)
      self.isMultisigWallet = true;

    $timeout(function() {
      self.selectedWalletId = client.credentials.walletId;
      self.selectedWalletName = client.credentials.walletName;
      $scope.$apply();
    }, 100);
  };

  $scope.openWalletsModal = function(wallets) {
    self.error = null;

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
        self.isMultisigWallet = false;
        self.selectedWalletId = walletId;
        self.selectedWalletName = client.credentials.walletName;
        if (client.credentials.n > 1)
          self.isMultisigWallet = true;
        $scope.$apply();
      }, 100);
      $scope.walletsModal.hide();
    });
  };

  this.sendFunds = function() {
    self.error = null;

    var dataSrc = {
      amount: $scope.fiat,
      currency: 'USD'
    };
    var outputs = [];
    var config = configService.getSync();
    var configWallet = config.wallet;
    var walletSettings = configWallet.settings;


    ongoingProcess.set('Processing Transaction...', true);
    $timeout(function() {

      bitpayCardService.topUp(dataSrc, function(err, invoiceId) {
        if (err) {
          ongoingProcess.set('Processing Transaction...', false);
          self.error = bwcError.msg(err);
          $timeout(function() {
            $scope.$digest();
          });
          return;
        }

        bitpayCardService.getInvoice(invoiceId, function(err, data) {
        var address, comment, amount;

        address = data.bitcoinAddress;
        amount = parseInt((data.btcPrice * 100000000).toFixed(0));
        comment = data.itemDesc;

        outputs.push({
          'toAddress': address,
          'amount': amount,
          'message': comment
        });

        var txp = {
          toAddress: address,
          amount: amount,
          outputs: outputs,
          message: comment,
          payProUrl: null,
          excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
          feeLevel: walletSettings.feeLevel || 'normal'
        };

        walletService.createTx(client, txp, function(err, createdTxp) {
          ongoingProcess.set('Processing Transaction...', false);
          if (err) {
            self.error = bwcError.msg(err);
            $timeout(function() {
              $scope.$digest();
            });
            return;
          }
          $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
            if (accept) {
              self.confirmTx(createdTxp, function(err, tx) {
                ongoingProcess.set('Processing Transaction...', false);
                if (err) {
                  self.error = bwcError.msg(err);
                  $timeout(function() {
                    $scope.$digest();
                  });
                  return;
                }
                self.update();
                $scope.addFunds = false;
                $timeout(function() {
                  $scope.$digest();
                });
              });
            }
          });
          });
        });
      });
    }, 100);
  };

  this.confirmTx = function(txp, cb) {

    fingerprintService.check(client, function(err) {
      if (err) {
        $log.debug(err);
        return cb(err);
      }

      handleEncryptedWallet(client, function(err) {
        if (err) {
          $log.debug(err);
          return bwcError.cb(err, null, cb);
        }

        ongoingProcess.set('Processing Transaction...', true);
        walletService.publishTx(client, txp, function(err, publishedTxp) {
          if (err) {
            $log.debug(err);
            return bwcError.cb(err, null, cb);
          }

          walletService.signTx(client, publishedTxp, function(err, signedTxp) {
            walletService.lock(client);
            if (err) {
              $log.debug(err);
              walletService.removeTx(client, signedTxp, function(err) {
                if (err) $log.debug(err);
              });
              return bwcError.cb(err, null, cb);
            }

            walletService.broadcastTx(client, signedTxp, function(err, broadcastedTxp) {
              if (err) {
                $log.debug(err);
                walletService.removeTx(client, broadcastedTxp, function(err) {
                  if (err) $log.debug(err);
                });
                return bwcError.cb(err, null, cb);
              }
              $timeout(function() {
                return cb(null, broadcastedTxp);
              }, 5000);
            });
          });
        });
      });
    });
  };

  this.authenticate = function() {
    self.error = null;

    var data = {
      emailAddress : $scope.email,
      hashedPassword : pbkdf2Service.pbkdf2Sync($scope.password, '..............', 200, 64).toString('hex')
    };

    // POST /authenticate
    // emailAddress:
    // hashedPassword:
    self.authenticating = true;
    bitpayCardService.authenticate(data, function(err, auth) {
      self.authenticating = false;
      if (err && !err.data.error.twoFactorPending) {
        self.error = 'Authentiation error';
        return;
      }

      self.update();
      $timeout(function() {
        $scope.$apply();
      }, 100);
    });
  };

  this.authenticate2FA = function() {
    self.error = null;

    var data = {
      twoFactorCode : $scope.twoFactorCode
    };

    self.authenticating = true;
    bitpayCardService.authenticate2FA(data, function(err, auth) {
      self.authenticating = false;
      if (err) {
        self.error = 'Authentiation error';
        return;
      }

      self.update();
      $timeout(function() {
        $scope.$apply();
      }, 100);
    });
  };

  this.getMerchantInfo = function(tx) {
    var bpTranCodes = bitpayCardService.bpTranCodes;
    lodash.keys(bpTranCodes).forEach(function(code) {
      if (tx.type.indexOf(code) === 0) {
        lodash.assign(tx, bpTranCodes[code]);
      }
    });
  };

  this.getIconName = function(tx) {
    var icon = tx.mcc || tx.category || null;
    if (!icon) return 'default';
    return bitpayCardService.iconMap[icon];
  };

  this.processDescription = function(tx) {
    if (lodash.isArray(tx.description)) {
      return tx.description[0];
    }
    return tx.description;
  };

});

