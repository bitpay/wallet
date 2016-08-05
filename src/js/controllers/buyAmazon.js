'use strict';

angular.module('copayApp.controllers').controller('buyAmazonController',
  function($rootScope, $scope, $ionicModal, $log, $timeout, $state, lodash, profileService, bwcError, gettext, configService, walletService, fingerprintService, amazonService, ongoingProcess) {

    var self = this;
    var client;

    var handleEncryptedWallet = function(client, cb) {
      if (!walletService.isEncrypted(client)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    this.init = function() {
      var network = amazonService.getEnvironment();
      self.allWallets = profileService.getWallets(network, 1);
      client = profileService.focusedClient;

      if (!client) return;

      if (lodash.isEmpty(self.allWallets)) return;

      if (client.credentials.network != network) return;

      $timeout(function() {
        self.selectedWalletId = client.credentials.walletId;
        self.selectedWalletName = client.credentials.walletName;
        $scope.$apply();
      }, 100);
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'SELL';
      $scope.wallets = wallets;
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

    this.createTx = function() {
      self.error = null;
      self.errorInfo = null;

      var dataSrc = {
        currency: 'USD',
        amount: $scope.fiat,
        uuid: self.selectedWalletId
      };
      var outputs = [];
      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;


      ongoingProcess.set('Processing Transaction...', true);
      $timeout(function() {
        amazonService.createBitPayInvoice(dataSrc, function(err, dataInvoice) {
          if (err) {
            ongoingProcess.set('Processing Transaction...', false);
            self.error = bwcError.msg(err);
            $timeout(function() {
              $scope.$digest();
            });
            return;
          }

          amazonService.getBitPayInvoice(dataInvoice.invoiceId, function(err, invoice) {
            if (err) {
              ongoingProcess.set('Processing Transaction...', false);
              self.error = bwcError.msg(err);
              $timeout(function() {
                $scope.$digest();
              });
              return;
            }

            $log.debug('Fetch PayPro Request...', invoice.paymentUrls.BIP73);

            client.fetchPayPro({
              payProUrl: invoice.paymentUrls.BIP73,
            }, function(err, paypro) {

              if (err) {
                ongoingProcess.set('Processing Transaction...', false);
                $log.warn('Could not fetch payment request:', err);
                var msg = err.toString();
                if (msg.match('HTTP')) {
                  msg = gettext('Could not fetch payment information');
                }
                self.error = msg;
                $timeout(function() {
                  $scope.$digest();
                });
                return;
              }

              if (!paypro.verified) {
                ongoingProcess.set('Processing Transaction...', false);
                $log.warn('Failed to verify payment protocol signatures');
                self.error = gettext('Payment Protocol Invalid');
                $timeout(function() {
                  $scope.$digest();
                });
                return;
              }

              var address, comment, amount, url;

              address = paypro.toAddress;
              amount = paypro.amount;
              url = paypro.url;
              comment = 'Amazon.com Gift Card';

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
                payProUrl: url,
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
                      if (err) {
                        ongoingProcess.set('Processing Transaction...', false);
                        self.error = bwcError.msg(err);
                        $timeout(function() {
                          $scope.$digest();
                        });
                        return;
                      }
                      var count = 0;
                      ongoingProcess.set('Processing Transaction...', true);

                      dataSrc.accessKey = dataInvoice.accessKey;
                      dataSrc.invoiceId = invoice.id;
                      dataSrc.invoiceUrl = invoice.url;
                      dataSrc.invoiceTime = invoice.invoiceTime;

                      self.debounceCreate(count, dataSrc);
                    });
                  }
                });
              });
            });
          });
        });
      }, 100);
    };

    self.debounceCreate = lodash.throttle(function(count, dataSrc) {
      self.debounceCreateGiftCard(count, dataSrc);
    }, 8000, {
      'leading': true
    });

    self.debounceCreateGiftCard = function(count, dataSrc) {

      amazonService.createGiftCard(dataSrc, function(err, giftCard) {
        $log.debug("creating gift card " + count);
        if (err) {
          giftCard = {};
          giftCard.status = 'FAILURE';
          ongoingProcess.set('Processing Transaction...', false);
          self.error = bwcError.msg(err);
          self.errorInfo = dataSrc;
          $timeout(function() {
            $scope.$digest();
          });
        }

        if (giftCard.status == 'PENDING' && count < 3) {
          $log.debug("pending gift card not available yet");
          self.debounceCreate(count + 1, dataSrc, dataSrc);
          return;
        }

        var now = moment().unix() * 1000;

        var newData = giftCard;
        newData['invoiceId'] = dataSrc.invoiceId;
        newData['accessKey'] = dataSrc.accessKey;
        newData['invoiceUrl'] = dataSrc.invoiceUrl;
        newData['amount'] = dataSrc.amount;
        newData['date'] = dataSrc.invoiceTime || now;
        newData['uuid'] = dataSrc.uuid;

        if (newData.status == 'expired') {
          amazonService.savePendingGiftCard(newData, {
            remove: true
          }, function(err) {
            return;
          });
        }

        amazonService.savePendingGiftCard(newData, null, function(err) {
          ongoingProcess.set('Processing Transaction...', false);
          $log.debug("Saving new gift card with status: " + newData.status);

          self.giftCard = newData;
          if (newData.status == 'PENDING') $state.transitionTo('amazon');
          $timeout(function() {
            $scope.$digest();
          });
        });
      });
    }

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

  });
