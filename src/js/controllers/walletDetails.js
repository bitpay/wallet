'use strict';

angular.module('copayApp.controllers').controller('walletDetailsController', function($scope, $rootScope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, $state, $stateParams, profileService, lodash, configService, gettextCatalog, platformInfo, walletService, txpModalService, externalLinkService, popupService) {
  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var isAndroid = platformInfo.isAndroid;
  var isChromeApp = platformInfo.isChromeApp;

  var HISTORY_SHOW_LIMIT = 10;
  var currentTxHistoryPage;
  var wallet;
  $scope.txps = [];

  $scope.openExternalLink = function(url, target) {
    externalLinkService.open(url, target);
  };

  var setPendingTxps = function(txps) {

    /* Uncomment to test multiple outputs */

    // var txp = {
    //   message: 'test multi-output',
    //   fee: 1000,
    //   createdOn: new Date() / 1000,
    //   outputs: [],
    //   wallet: wallet
    // };
    //
    // function addOutput(n) {
    //   txp.outputs.push({
    //     amount: 600,
    //     toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
    //     message: 'output #' + (Number(n) + 1)
    //   });
    // };
    // lodash.times(15, addOutput);
    // txps.push(txp);

    if (!txps) {
      $scope.txps = [];
      return;
    }
    $scope.txps = lodash.sortBy(txps, 'createdOn').reverse();
  };


  $scope.updateStatus = function(force) {
    $scope.updatingStatus = true;
    $scope.updateStatusError = false;
    $scope.walletNotRegistered = false;

    walletService.getStatus(wallet, {
      force: !!force,
    }, function(err, status) {
      $scope.updatingStatus = false;
      if (err) {
        if (err === 'WALLET_NOT_REGISTERED') {
          $scope.walletNotRegistered = true;
        } else {
          $scope.updateStatusError = true;
        }
        $scope.status = null;
        return;
      }

      setPendingTxps(status.pendingTxps);

      $scope.status = status;
      $timeout(function() {
        $scope.$apply();
      }, 1);

    });
  };


  $scope.openTxpModal = txpModalService.open;

  var listeners = [
    $rootScope.$on('bwsEvent', function(e, walletId) {
      if (walletId == wallet.id)
        $scope.updateStatus();
    }),
    $rootScope.$on('Local/TxAction', function(e, walletId) {
      if (walletId == wallet.id)
        $scope.updateStatus();
    }),
  ];

  $scope.$on('$destroy', function() {
    lodash.each(listeners, function(x) {
      x();
    });
  });


  $scope.openSearchModal = function() {
    $scope.color = wallet.color;

    $ionicModal.fromTemplateUrl('views/modals/search.html', {
      scope: $scope,
      focusFirstInput: true
    }).then(function(modal) {
      $scope.searchModal = modal;
      $scope.searchModal.show();
    });

    $scope.close = function() {
      $scope.searchModal.hide();
    }
  };

  $scope.openTxModal = function(btx) {
    $scope.btx = lodash.cloneDeep(btx);
    $scope.walletId = wallet.id;
    $ionicModal.fromTemplateUrl('views/modals/tx-details.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.txDetailsModal = modal;
      $scope.txDetailsModal.show();
    });
  };

  $scope.recreate = function() {
    walletService.recreate(wallet, function(err) {
      $scope.init();
      if (err) return;
      $timeout(function() {
        walletService.startScan(wallet, function() {
          $scope.$apply();
        });
      });
    });
  };

  $scope.updateTxHistory = function(cb) {
    if (!cb) cb = function() {};
    if ($scope.updatingTxHistory) return;

    $scope.updatingTxHistory = true;
    $scope.updateTxHistoryError = false;
    $scope.updatingTxHistoryProgress = null;

    var progressFn = function(txs) {
      $scope.updatingTxHistoryProgress = txs ? txs.length : 0;
      $scope.completeTxHistory = txs;
      $scope.showHistory();
      $timeout(function() {
        $scope.$apply();
      }, 1);
    };

    $timeout(function() {
      walletService.getTxHistory(wallet, {
        progressFn: progressFn,
      }, function(err, txHistory) {
        $scope.updatingTxHistory = false;
        if (err) {
          $scope.txHistory = null;
          $scope.updateTxHistoryError = true;
          return;
        }
        $scope.completeTxHistory = txHistory;

        $scope.showHistory();

        $timeout(function() {
          $scope.$apply();
        }, 1);
        return cb();
      });
    });
  };

  $scope.showHistory = function() {
    if ($scope.completeTxHistory) {
      $scope.txHistory = $scope.completeTxHistory.slice(0, (currentTxHistoryPage + 1) * HISTORY_SHOW_LIMIT);
      $scope.txHistoryShowMore = $scope.completeTxHistory.length > $scope.txHistory.length;
    }
  };

  $scope.showMore = function() {
    currentTxHistoryPage++;
    $scope.showHistory();
    $scope.$broadcast('scroll.infiniteScrollComplete');
  };

  $scope.updateAll = function(cb)  {
    $scope.updateStatus(false);
    $scope.updateTxHistory(cb);
  };

  $scope.hideToggle = function() {
    profileService.toggleHideBalanceFlag(wallet.credentials.walletId, function(err) {
      if (err) $log.error(err);
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data){
    currentTxHistoryPage = 0;
    $scope.completeTxHistory = [];

    wallet = profileService.getWallet($stateParams.walletId);

    /* Set color for header bar */
    $scope.walletDetailsColor = wallet.color;
    $scope.walletDetailsName = wallet.name;
    $scope.wallet = wallet;

    $scope.requiresMultipleSignatures = wallet.credentials.m > 1;
    $scope.newTx = false;

    $scope.updateAll(function() {
      if ($stateParams.txid) {
        var tx = lodash.find($scope.completeTxHistory, {
          txid: $stateParams.txid
        });
        if (tx) {
          $scope.openTxModal(tx);
        } else {
          popupService.showAlert(null, gettextCatalog.getString('TX not available'));
        }
      } else if ($stateParams.txpId) {
        var txp = lodash.find($scope.txps, {
          id: $stateParams.txpId
        });
        if (txp) {
          $scope.openTxpModal(txp);
        } else {
          popupService.showAlert(null, gettextCatalog.getString('Proposal not longer available'));
        }
      }
    });
  });
});
