'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, $state, $stateParams, $ionicModal, $ionicScrollDelegate, gettextCatalog, lodash, popupService, ongoingProcess, profileService, walletService, configService, $log, platformInfo, storageService, txpModalService, $window) {
    var wallet;
    $scope.externalServices = {};
    $scope.bitpayCardEnabled = true; // TODO
    $scope.openTxpModal = txpModalService.open;
    $scope.version = $window.version;
    $scope.name = $window.appConfig.nameCase;
    $scope.homeTip = $stateParams.fromOnboarding;

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

      $state.go('tabs.details', {
        walletId: wallet.credentials.walletId
      });
    };

    function updateTxps() {
      profileService.getTxps({
        limit: 3
      }, function(err, txps, n) {
        if (err) $log.error(err);
        $scope.txps = txps;
        $scope.txpsN = n;
        $ionicScrollDelegate.resize();

        $timeout(function() {
          $scope.$apply();
        }, 1);
      })
    };

    $scope.updateAllWallets = function() {
      $scope.wallets = profileService.getWallets();
      if (lodash.isEmpty($scope.wallets)) return;

      var i = $scope.wallets.length;
      var j = 0;
      var timeSpan = 60 * 60 * 24 * 7;
      var notifications = [];

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

      $scope.fetchingNotifications = true;
      profileService.getNotifications({
        limit: 3
      }, function(err, n) {
        if (err) {
          console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
          return;
        }
        $scope.fetchingNotifications = false;
        $scope.notifications = n;
        $ionicScrollDelegate.resize();

        $timeout(function() {
          $scope.$apply();
        }, 1);

      })
    };

    $scope.updateWallet = function(wallet) {
      $log.debug('Updating wallet:' + wallet.name)
      walletService.getStatus(wallet, {}, function(err, status) {
        if (err) {
          $log.error(err); //TODO
          return;
        }
        wallet.status = status;

        $scope.fetchingNotifications = true;
        profileService.getNotifications({
          limit: 3
        }, function(err, notifications) {
          $scope.fetchingNotifications = false;
          if (err) {
            console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
            return;
          }
          $scope.notifications = notifications;

          updateTxps();
        })
      });
    };

    $scope.hideHomeTip = function() {
      $scope.homeTip = null;
      $state.transitionTo($state.current, null, {
        reload: true,
        inherit: false,
        notify: false
      });
    };

    $scope.nextStep = function() {
      lodash.each(['AmazonGiftCards', 'BitpayCard', 'BuyAndSell'], function(service) {
        storageService.getNextStep(service, function(err, value) {
          $scope.externalServices[service] = value ? true : false;
          $ionicScrollDelegate.resize();
        });
      });
    };

    var listeners = [
      $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
        var wallet = profileService.getWallet(walletId);
        $scope.updateWallet(wallet);
      }),
      $rootScope.$on('Local/TxAction', function(e, walletId) {
        $log.debug('Got action for wallet ' + walletId);
        var wallet = profileService.getWallet(walletId);
        $scope.updateWallet(wallet);
      }),
    ];

    $scope.$on('$destroy', function() {
      lodash.each(listeners, function(x) {
        x();
      });
    });

    $scope.$on("$ionicView.enter", function(event, data){
      configService.whenAvailable(function() {
        var config = configService.getSync();
        var isWindowsPhoneApp = platformInfo.isWP && platformInfo.isCordova;
        $scope.glideraEnabled = config.glidera.enabled && !isWindowsPhoneApp;
        $scope.coinbaseEnabled = config.coinbase.enabled && !isWindowsPhoneApp;
      });
      $scope.nextStep();
      $scope.updateAllWallets();
    });
  });
