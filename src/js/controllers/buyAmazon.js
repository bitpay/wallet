'use strict';

angular.module('copayApp.controllers').controller('buyAmazonController',
  function($rootScope, $scope, $ionicModal, $log, $timeout, $state, $ionicPopup, lodash, profileService, bwcError, gettext, configService, walletService, fingerprintService, amazonService, ongoingProcess, platformInfo, nodeWebkit) {

    var self = this;
    var wallet;

    $scope.$on('Wallet/Changed', function(event, w) {
      if (lodash.isEmpty(w)) {
        $log.debug('No wallet provided');
        return;
      }
      wallet = w;
      $log.debug('Wallet changed: ' + w.name);
    });

    $scope.openExternalLink = function(url, target) {
      if (platformInfo.isNW) {
        nodeWebkit.openExternalLink(url);
      } else {
        target = target || '_blank';
        var ref = window.open(url, target, 'location=no');
      }
    };

    this.init = function() {
      var network = amazonService.getEnvironment();
      $scope.wallets = profileService.getWallets({
        network: network,
        onlyComplete: true
      });
    };

    this.createTx = function() {
      self.error = null;
      self.errorInfo = null;

      if (lodash.isEmpty(wallet)) return;

      if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
        $log.info('No signing proposal: No private key');
        self.error = bwcError.msg('MISSING_PRIVATE_KEY');
        return;
      }

      var dataSrc = {
        currency: 'USD',
        amount: $scope.fiat,
        uuid: wallet.id
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

            wallet.fetchPayPro({
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

              walletService.createTx(wallet, txp, function(err, createdTxp) {
                ongoingProcess.set('Processing Transaction...', false);
                if (err) {
                  self.error = bwcError.msg(err);
                  $timeout(function() {
                    $scope.$digest();
                  });
                  return;
                }
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
          if (newData.status == 'PENDING') $state.transitionTo('amazon.main');
          $timeout(function() {
            $scope.$digest();
          });
        });
      });
    };

    this.confirmTx = function(txp, cb) {
      fingerprintService.check(wallet, function(err) {
        if (err) {
          $log.debug(err);
          return cb(err);
        }

        walletService.handleEncryptedWallet(wallet, function(err) {
          if (err) {
            $log.debug(err);
            return bwcError.cb(err, null, cb);
          }

          ongoingProcess.set('Processing Transaction...', true);
          walletService.publishTx(wallet, txp, function(err, publishedTxp) {
            if (err) {
              $log.debug(err);
              return bwcError.cb(err, null, cb);
            }

            walletService.signTx(wallet, publishedTxp, function(err, signedTxp) {
              walletService.lock(wallet);
              if (err) {
                $log.debug(err);
                walletService.removeTx(wallet, signedTxp, function(err) {
                  if (err) $log.debug(err);
                });
                return bwcError.cb(err, null, cb);
              }
              if (signedTxp.status == 'accepted') {
                walletService.broadcastTx(wallet, signedTxp, function(err, broadcastedTxp) {
                  if (err) {
                    $log.debug(err);
                    walletService.removeTx(wallet, broadcastedTxp, function(err) {
                      if (err) $log.debug(err);
                    });
                    return bwcError.cb(err, null, cb);
                  }
                  $timeout(function() {
                    return cb(null, broadcastedTxp);
                  }, 5000);
                });
              } else {
                $timeout(function() {
                  return cb(null, signedTxp);
                }, 5000);
              }
            });
          });
        });
      });
    };

  });
