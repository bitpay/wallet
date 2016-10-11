'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, $state, $stateParams, $ionicModal, $ionicScrollDelegate, gettextCatalog, lodash, popupService, ongoingProcess, profileService, walletService, configService, $log, platformInfo, storageService, txpModalService, $window, bitpayCardService) {
    var wallet;
    var listeners = [];
    var notifications = [];
    $scope.externalServices = {};
    $scope.bitpayCardEnabled = true; // TODO
    $scope.openTxpModal = txpModalService.open;
    $scope.version = $window.version;
    $scope.name = $window.appConfig.nameCase;
    $scope.homeTip = $stateParams.fromOnboarding;
    $scope.isCordova = platformInfo.isCordova;

    if (!$scope.homeTip) {
      storageService.getHomeTipAccepted(function(error, value) {
        $scope.homeTip = (value == 'false') ? false : true;
      });
    }

    $scope.openNotificationModal = function(n) {
      wallet = profileService.getWallet(n.walletId);

      if (n.txid) {
        openTxModal(n);
      } else {
        var txp = lodash.find($scope.txps, {
          id: n.txpId
        });
        if (txp) {
          txpModalService.open(txp);
        } else {
          ongoingProcess.set('loadingTxInfo', true);
          walletService.getTxp(wallet, n.txpId, function(err, txp) {
            var _txp = txp;
            ongoingProcess.set('loadingTxInfo', false);
            if (err) {
              $log.warn('No txp found');
              return popupService.showAlert(null, gettextCatalog.getString('Transaction not found'));
            }
            txpModalService.open(_txp);
          });
        }
      }
    };

    var openTxModal = function(n) {
      wallet = profileService.getWallet(n.walletId);

      ongoingProcess.set('loadingTxInfo', true);
      walletService.getTx(wallet, n.txid, function(err, tx) {
        ongoingProcess.set('loadingTxInfo', false);

        if (err) {
          $log.error(err);
          return popupService.showAlert(gettextCatalog.getString('Error'), err);
        }

        if (!tx) {
          $log.warn('No tx found');
          return popupService.showAlert(null, gettextCatalog.getString('Transaction not found'));
        }

        $scope.wallet = wallet;
        $scope.btx = lodash.cloneDeep(tx);
        $ionicModal.fromTemplateUrl('views/modals/tx-details.html', {
          scope: $scope
        }).then(function(modal) {
          $scope.txDetailsModal = modal;
          $scope.txDetailsModal.show();
        });

        walletService.getTxNote(wallet, n.txid, function(err, note) {
          if (err) $log.debug(gettextCatalog.getString('Could not fetch transaction note'));
          $scope.btx.note = note;
        });
      });
    };

    $scope.openWallet = function(wallet) {
      if (!wallet.isComplete()) {
        return $state.go('tabs.copayers', {
          walletId: wallet.credentials.walletId
        });
      }

      $state.go('tabs.wallet', {
        walletId: wallet.credentials.walletId
      });
    };

    var updateTxps = function() {
      profileService.getTxps({
        limit: 3
      }, function(err, txps, n) {
        if (err) $log.error(err);
        $scope.txps = txps;
        $scope.txpsN = n;
        $timeout(function() {
          $ionicScrollDelegate.resize();
        }, 100);
      })
    };

    var updateAllWallets = function() {
      $scope.wallets = profileService.getWallets();
      if (lodash.isEmpty($scope.wallets)) return;

      var i = $scope.wallets.length;
      var j = 0;
      var timeSpan = 60 * 60 * 24 * 7;

      lodash.each($scope.wallets, function(wallet) {
        walletService.getStatus(wallet, {}, function(err, status) {
          if (err) {
            $log.error(err);
          } else {
            wallet.status = status;
          }
          if (++j == i) {
            updateTxps();
          }
        });
      });

      if (!$scope.recentTransactionsEnabled) return;
      $scope.fetchingNotifications = true;
      profileService.getNotifications({
        limit: 3
      }, function(err, n) {
        if (err) {
          $log.error(err);
          return;
        }
        $scope.fetchingNotifications = false;
        $scope.notifications = n;

        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 100);

      })
    };

    var updateWallet = function(wallet) {
      $log.debug('Updating wallet:' + wallet.name)
      walletService.getStatus(wallet, {}, function(err, status) {
        if (err) {
          $log.error(err);
          return;
        }
        wallet.status = status;
        updateTxps();

        if (!$scope.recentTransactionsEnabled) return;

        $scope.fetchingNotifications = true;
        profileService.getNotifications({
          limit: 3
        }, function(err, notifications) {
          $scope.fetchingNotifications = false;
          if (err) {
            $log.error(err);
            return;
          }
          $scope.notifications = notifications;
        });
      });
    };

    $scope.hideHomeTip = function() {
      storageService.setHomeTipAccepted(false, function(error, value) {
        $scope.homeTip = false;
      });
    };

    var nextStep = function() {
      lodash.each(['AmazonGiftCards', 'BitpayCard', 'BuyAndSell'], function(service) {
        storageService.getNextStep(service, function(err, value) {
          $scope.externalServices[service] = value ? true : false;
          $timeout(function() {
            $ionicScrollDelegate.resize();
          }, 10);
        });
      });
    };

    $scope.shouldHideNextSteps = function() {
      $scope.hideNextSteps = !$scope.hideNextSteps;
      $timeout(function() {
        $ionicScrollDelegate.resize();
        $scope.$apply();
      }, 100);
    };

    var bitpayCardCache = function() {
      bitpayCardService.getCacheData(function(err, data) {
        if (err ||  lodash.isEmpty(data)) return;
        $scope.bitpayCard = data;
      });
    };

    $scope.onRefresh = function() {
      $scope.$broadcast('scroll.refreshComplete');
      updateAllWallets();
    };

    $scope.$on("$ionicView.enter", function(event, data) {
      $scope.bitpayCard = null;
      nextStep();
      updateAllWallets();

      listeners = [
        $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
          var wallet = profileService.getWallet(walletId);
          updateWallet(wallet);
        }),
        $rootScope.$on('Local/TxAction', function(e, walletId) {
          $log.debug('Got action for wallet ' + walletId);
          var wallet = profileService.getWallet(walletId);
          updateWallet(wallet);
        })
      ];

      configService.whenAvailable(function() {
        var config = configService.getSync();
        var isWindowsPhoneApp = platformInfo.isWP && platformInfo.isCordova;

        $scope.glideraEnabled = config.glidera.enabled && !isWindowsPhoneApp;
        $scope.coinbaseEnabled = config.coinbase.enabled && !isWindowsPhoneApp;
        $scope.amazonEnabled = config.amazon.enabled;
        $scope.bitpayCardEnabled = config.bitpayCard.enabled;

        var buyAndSellEnabled = !$scope.externalServices.BuyAndSell && ($scope.glideraEnabled || $scope.coinbaseEnabled);
        var amazonEnabled = !$scope.externalServices.AmazonGiftCards && $scope.amazonEnabled;
        var bitpayCardEnabled = !$scope.externalServices.BitpayCard && $scope.bitpayCardEnabled;

        $scope.nextStepEnabled = buyAndSellEnabled || amazonEnabled || bitpayCardEnabled;
        $scope.recentTransactionsEnabled = config.recentTransactions.enabled;

        if ($scope.bitpayCardEnabled) bitpayCardCache();
      });
    });

    $scope.$on("$ionicView.leave", function(event, data) {
      lodash.each(listeners, function(x) {
        x();
      });
    });

  });
