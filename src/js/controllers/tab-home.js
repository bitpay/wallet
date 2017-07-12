'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, $state, $filter, $stateParams, $ionicModal, $ionicScrollDelegate, $window, bwcService, gettextCatalog, lodash, popupService, rateService, ongoingProcess, externalLinkService, latestReleaseService, profileService, walletService, configService, $log, platformInfo, storageService, txpModalService, appConfigService, startupService, addressbookService, feedbackService, bwcError, nextStepsService, buyAndSellService, homeIntegrationsService, bitpayCardService, pushNotificationsService, timeService) {
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
    $scope.localCurrencySymbol = '$';
    
    $scope.$on("$ionicView.afterEnter", function() {
      startupService.ready();
    });

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      if (!$scope.homeTip) {
        storageService.getHomeTipAccepted(function(error, value) {
          $scope.homeTip = (value == 'accepted') ? false : true;
        });
      }

      if ($scope.isNW) {
        latestReleaseService.checkLatestRelease(function(err, newRelease) {
          if (err) {
            $log.warn(err);
            return;
          }
          if (newRelease) {
            $scope.newRelease = true;
            $scope.updateText = gettextCatalog.getString('There is a new version of {{appName}} available', {
              appName: $scope.name
            });
          }
        });
      }

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

      bitpayCardService.get({}, function(err, cards) {
        $scope.bitpayCardItems = cards;
      });

      configService.whenAvailable(function(config) {
        $scope.recentTransactionsEnabled = config.recentTransactions.enabled;
        if ($scope.recentTransactionsEnabled) getNotifications();

        $scope.showBitcoinPriceEnabled = config.showBitcoinPrice.enabled;
        if ($scope.showBitcoinPriceEnabled) setCurrentPrice(config);

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

    /*var setCurrentPrice = function(config) {
      $scope.unitName = config.wallet.settings.unitName;
      $scope.selectedAlternative = {
        name: config.wallet.settings.alternativeName,
        isoCode: config.wallet.settings.alternativeIsoCode
      };

      rateService.whenAvailable(function() {
        var walletClient = bwcService.getClient();

        var now = moment().unix();
        var yesterday = now - 24 * 60 * 60;

        var localCurrency = $scope.selectedAlternative.isoCode;
        var btcAmount = 1;
        var currentRate = rateService.toFiat(btcAmount * 1e8, localCurrency);
        $scope.localCurrencyPerBtc = $filter('formatFiatAmount')(parseFloat(currentRate.toFixed(2), 10));

        walletClient.getFiatRate({
          code: $scope.selectedAlternative.isoCode,
          ts: yesterday * 1000
        }, function(err, res) {
          if (err) {
            $log.debug('Could not get historic rate');
            return;
          }
          if (res && res.rate) {
            $scope.rateDate = res.fetchedOn;
            $scope.yesterdayRate = res.rate;
          }
          calculateProfitPercent($scope.yesterdayRate, parseFloat(currentRate.toFixed(2), 10));
        });
      });
    };*/

    var setCurrentPrice = function(config) {
      var data = {
        ts: 1491523200,
        rate: 2370.48,
        variationAbs24h: 12.3,
        variationRel24h: 0.52,
        min24h: 2101.65,
        max24h: 2543.23,
        data: [
          {
            ts: 1491523200,
            rate: 2500.24
          }, {
            ts: 1491609600,
            rate: 2675.24
          }, {
            ts: 1491696000,
            rate: 2786.50
          }, {
            ts: 1491782400,
            rate: 2799
          }, {
            ts: 1491868800,
            rate: 2813.60
          }, {
            ts: 1491955200,
            rate: 3012.24
          }, {
            ts: 1492041600,
            rate: 2901.24
          }, {
            ts: 1492128000,
            rate: 2608.24
          }, {
            ts: 1492214400,
            rate: 2401.24
          }, {
            ts: 1492300800,
            rate: 2333.24
          }, {
            ts: 1492387200,
            rate: 2292.24
          }, {
            ts: 1492473600,
            rate: 2366.24
          }, {
            ts: 1492560000,
            rate: 2500.24
          }, {
            ts: 1492646400,
            rate: 2567.24
          }, {
            ts: 1492732800,
            rate: 2678.24
          }
        ]
      }

      $scope.localCurrencyPerBtc = data.rate;
      $scope.difference = Math.abs(data.variationAbs24h);
      $scope.percentage = data.variationRel24h;
      $scope.negativeProfit = !(data.variationAbs24h >= 0);
      $scope.low24h = data.min24h;
      $scope.high24h = data.max24h;

      console.log("Hola, aca esta la data: ", data);
    };

    var calculateProfitPercent = function(yesterdayPrice, actualPrice) {

      $scope.difference = Math.abs((actualPrice - yesterdayPrice).toFixed(2));
      $scope.percentage = ($scope.difference * 100 / yesterdayPrice).toFixed(2);

      $scope.negativeProfit = !(actualPrice >= yesterdayPrice);
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
  });
