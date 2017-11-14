'use strict';

angular.module('copayApp.controllers').controller('changellyController',
  function($rootScope, $timeout, $scope, $state, $stateParams, $ionicModal, $ionicScrollDelegate, $window, gettextCatalog, lodash, popupService,
    ongoingProcess, externalLinkService, latestReleaseService, profileService, walletService, configService, $log, platformInfo, storageService,
    txpModalService, appConfigService, startupService, addressbookService, feedbackService, bwcError, nextStepsService, buyAndSellService,
    homeIntegrationsService, bitpayCardService, pushNotificationsService, timeService) {
    var wallet;
    var listeners = [];
    var notifications = [];
    $scope.externalServices = {};
    $scope.openTxpModal = txpModalService.open;
    $scope.version = $window.version;
    $scope.name = appConfigService.nameCase;
    $scope.homeTip = $stateParams.fromOnboarding;
    $scope.isCordova = platformInfo.isCordova;
    $scope.isAndroid = platformInfo.isAndroid;
    $scope.isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;
    $scope.isNW = platformInfo.isNW;
    $scope.showRateCard = {};

    $scope.$on("$ionicView.afterEnter", function() {
      startupService.ready();
    });

    $scope.$on("$ionicView.beforeEnter", function(event, data) {

      storageService.getFeedbackInfo(function(error, info) {

        if ($scope.isWindowsPhoneApp) {
          $scope.showRateCard.value = false;
          return;
        }
        if (!info) {
          initFeedBackInfo();
        } else {
          var feedbackInfo = JSON.parse(info);
          //Check if current version is greater than saved version
          var currentVersion = $scope.version;
          var savedVersion = feedbackInfo.version;
          var isVersionUpdated = feedbackService.isVersionUpdated(currentVersion, savedVersion);
          if (!isVersionUpdated) {
            initFeedBackInfo();
            return;
          }
          var now = moment().unix();
          var timeExceeded = (now - feedbackInfo.time) >= 24 * 7 * 60 * 60;
          $scope.showRateCard.value = timeExceeded && !feedbackInfo.sent;
          $timeout(function() {
            $scope.$apply();
          });
        }
      });

      function initFeedBackInfo() {
        var feedbackInfo = {};
        feedbackInfo.time = moment().unix();
        feedbackInfo.version = $scope.version;
        feedbackInfo.sent = false;
        storageService.setFeedbackInfo(JSON.stringify(feedbackInfo), function() {
          $scope.showRateCard.value = false;
        });
      };

      $scope.wallets = profileService.getWallets();
      $scope.singleWallet = $scope.wallets.length == 1;

      if (!$scope.wallets[0]) return;

      // select first wallet if no wallet selected previously
      var selectedWallet = checkSelectedWallet($scope.wallet, $scope.wallets);
      $scope.onWalletSelect(selectedWallet);

      listeners = [
        $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
          // Update current address
          if ($scope.wallet && walletId == $scope.wallet.id && type == 'NewIncomingTx') $scope.setAddress(true);
        })
      ];
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      updateAllWallets();

      addressbookService.list(function(err, ab) {
        if (err) $log.error(err);
        $scope.addressbook = ab || {};
      });

      listeners = [
        $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
          var wallet = profileService.getWallet(walletId);
          updateWallet(wallet);
          if ($scope.recentTransactionsEnabled) getNotifications();

        }),
        $rootScope.$on('Local/TxAction', function(e, walletId) {
          $log.debug('Got action for wallet ' + walletId);
          var wallet = profileService.getWallet(walletId);
          updateWallet(wallet);
          if ($scope.recentTransactionsEnabled) getNotifications();
        })
      ];


      $scope.buyAndSellItems = buyAndSellService.getLinked();
      $scope.homeIntegrations = homeIntegrationsService.get();
      //
      // bitpayCardService.get({}, function(err, cards) {
      //   $scope.bitpayCardItems = cards;
      // });

      configService.whenAvailable(function(config) {
        $scope.recentTransactionsEnabled = config.recentTransactions.enabled;
        if ($scope.recentTransactionsEnabled) getNotifications();

        if (config.hideNextSteps.enabled) {
          $scope.nextStepsItems = null;
        } else {
          $scope.nextStepsItems = nextStepsService.get();
        }

        pushNotificationsService.init();

        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      });
    });

    $scope.$on("$ionicView.leave", function(event, data) {
      lodash.each(listeners, function(x) {
        x();
      });
    });

    $scope.createdWithinPastDay = function(time) {
      return timeService.withinPastDay(time);
    };

    $scope.openExternalLink = function() {
      var url = 'https://github.com/bitpay/copay/releases/latest';
      var optIn = true;
      var title = gettextCatalog.getString('Update Available');
      var message = gettextCatalog.getString('An update to this app is available. For your security, please update to the latest version.');
      var okText = gettextCatalog.getString('View Update');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };

    $scope.openNotificationModal = function(n) {
      wallet = profileService.getWallet(n.walletId);

      if (n.txid) {
        $state.transitionTo('tabs.wallet.tx-details', {
          txid: n.txid,
          walletId: n.walletId
        });
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
              return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Transaction not found'));
            }
            txpModalService.open(_txp);
          });
        }
      }
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
          $scope.$apply();
        }, 10);
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

            wallet.error = (err === 'WALLET_NOT_REGISTERED') ? gettextCatalog.getString('Wallet not registered') : bwcError.msg(err);

            $log.error(err);
          } else {
            wallet.error = null;
            wallet.status = status;

            // TODO service refactor? not in profile service
            profileService.setLastKnownBalance(wallet.id, wallet.status.totalBalanceStr, function() {});
          }
          if (++j == i) {
            updateTxps();
          }
        });
      });
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
      });
    };

    var getNotifications = function() {
      profileService.getNotifications({
        limit: 3
      }, function(err, notifications, total) {
        if (err) {
          $log.error(err);
          return;
        }
        $scope.notifications = notifications;
        $scope.notificationsN = total;
        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      });
    };

    $scope.hideHomeTip = function() {
      storageService.setHomeTipAccepted('accepted', function() {
        $scope.homeTip = false;
        $timeout(function() {
          $scope.$apply();
        })
      });
    };


    $scope.onRefresh = function() {
      $timeout(function() {
        $scope.$broadcast('scroll.refreshComplete');
      }, 300);
      updateAllWallets();
    };


    $scope.requestSpecificAmount = function() {
      $state.go('tabs.paymentRequest.amount', {
        id: $scope.wallet.credentials.walletId
      });
    };

    $scope.setAddress = function(newAddr) {
      $scope.addr = null;
      if (!$scope.wallet || $scope.generatingAddress || !$scope.wallet.isComplete()) return;
      $scope.generatingAddress = true;
      walletService.getAddress($scope.wallet, newAddr, function(err, addr) {
        $scope.generatingAddress = false;

        if (err) {
          //Error is already formated
          popupService.showAlert(err);
        }

        $scope.addr = addr;
        $timeout(function() {
          $scope.$apply();
        }, 10);
      });
    };

    $scope.goCopayers = function() {
      $ionicHistory.removeBackView();
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $state.go('tabs.home');
      $timeout(function() {
        $state.transitionTo('tabs.copayers', {
          walletId: $scope.wallet.credentials.walletId
        });
      }, 100);
    };

    $scope.openBackupNeededModal = function() {
      $ionicModal.fromTemplateUrl('views/includes/backupNeededPopup.html', {
        scope: $scope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        $scope.BackupNeededModal = modal;
        $scope.BackupNeededModal.show();
      });
    };

    $scope.close = function() {
      $scope.BackupNeededModal.hide();
      $scope.BackupNeededModal.remove();
    };

    $scope.doBackup = function() {
      $scope.close();
      $scope.goToBackupFlow();
    };

    $scope.goToBackupFlow = function() {
      $state.go('tabs.receive.backupWarning', {
        from: 'tabs.receive',
        walletId: $scope.wallet.credentials.walletId
      });
    };

    $scope.shouldShowReceiveAddressFromHardware = function() {
      var wallet = $scope.wallet;
      if (wallet.isPrivKeyExternal() && wallet.credentials.hwInfo) {
        return (wallet.credentials.hwInfo.name == walletService.externalSource.intelTEE.id);
      } else {
        return false;
      }
    };

    $scope.showReceiveAddressFromHardware = function() {
      var wallet = $scope.wallet;
      if (wallet.isPrivKeyExternal() && wallet.credentials.hwInfo) {
        walletService.showReceiveAddressFromHardware(wallet, $scope.addr, function() {});
      }
    };

    var checkSelectedWallet = function(wallet, wallets) {
      if (!wallet) return wallets[0];
      var w = lodash.find(wallets, function(w) {
        return w.id == wallet.id;
      });
      if (!w) return wallets[0];
      return wallet;
    }

    $scope.onWalletSelect = function(wallet) {
      $scope.wallet = wallet;
      $scope.setAddress();
    };

    $scope.showWalletSelector = function() {
      if ($scope.singleWallet) return;
      $scope.walletSelectorTitle = gettextCatalog.getString('Select a wallet');
      $scope.showWallets = true;
    };

    $scope.shareAddress = function() {
      if (!$scope.isCordova) return;
      window.plugins.socialsharing.share('Nav Coin:' + $scope.addr, null, null, null);
    }
  });
