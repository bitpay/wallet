'use strict';

angular.module('copayApp.controllers').controller('walletDetailsController', function($scope, $rootScope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, $state, $stateParams, profileService, lodash, configService, gettextCatalog, platformInfo, walletService, txpModalService, externalLinkService, popupService, addressbookService) {

  var HISTORY_SHOW_LIMIT = 10;
  var currentTxHistoryPage = 0;
  var listeners = [];
  $scope.txps = [];
  $scope.completeTxHistory = [];
  $scope.openTxpModal = txpModalService.open;
  $scope.isCordova = platformInfo.isCordova;
  $scope.isAndroid = platformInfo.isAndroid;

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
    //   wallet: $scope.wallet
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

  var updateStatus = function(force) {
    $scope.updatingStatus = true;
    $scope.updateStatusError = false;
    $scope.walletNotRegistered = false;

    walletService.getStatus($scope.wallet, {
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

  $scope.openSearchModal = function() {
    $scope.color = $scope.wallet.color;

    $ionicModal.fromTemplateUrl('views/modals/search.html', {
      scope: $scope,
      focusFirstInput: true
    }).then(function(modal) {
      $scope.searchModal = modal;
      $scope.searchModal.show();
    });

    $scope.close = function() {
      $scope.searchModal.hide();
    };
  };

  $scope.openTxModal = function(btx) {
    $scope.btx = lodash.cloneDeep(btx);
    $scope.walletId = $scope.wallet.id;
    $state.transitionTo('tabs.wallet.tx-details', {
      txid: $scope.btx.txid,
      walletId: $scope.walletId
    });
  };

  $scope.recreate = function() {
    walletService.recreate($scope.wallet, function(err) {
      if (err) return;
      $timeout(function() {
        walletService.startScan($scope.wallet, function() {
          $scope.$apply();
        });
      });
    });
  };

  var updateTxHistory = function(cb) {
    if (!cb) cb = function() {};
    if ($scope.updatingTxHistory) return;

    $scope.updatingTxHistory = true;
    $scope.updateTxHistoryError = false;
    $scope.updatingTxHistoryProgress = 0;

    var progressFn = function(txs, newTxs) {
      $scope.updatingTxHistoryProgress = newTxs;
      $scope.completeTxHistory = txs;
      $scope.showHistory();
      $timeout(function() {
        $scope.$apply();
      });
    };

    $timeout(function() {
      walletService.getTxHistory($scope.wallet, {
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
        $scope.$apply();
        return cb();
      });
    });
  };

  $scope.showHistory = function() {
    if ($scope.completeTxHistory) {
      $scope.txHistory = $scope.completeTxHistory.slice(0, (currentTxHistoryPage + 1) * HISTORY_SHOW_LIMIT);
      $scope.txHistoryShowMore = $scope.completeTxHistory.length > $scope.txHistory.length;
    }
    console.log('$scope.completeTxHistory', $scope.completeTxHistory);
  };

  $scope.getDate = function(txCreated) {
    var date = new Date(txCreated * 1000);
    return date;
  };

  $scope.showGroupHeader = function(index) {
    if(index === 0) {
      return true;
    }
    var curTx = $scope.txHistory[index];
    var prevTx = $scope.txHistory[index - 1];
    return !createdDuringSameMonth(curTx, prevTx);
  };

  function createdDuringSameMonth(tx1, tx2) {
    var date1 = new Date(tx1.time * 1000);
    var date2 = new Date(tx2.time * 1000);
    return getMonthYear(date1) === getMonthYear(date2);
  }

  $scope.createdWithinPastDay = function(tx) {
    var now = new Date();
    var date = new Date(tx.time * 1000);
    return (now.getTime() - date.getTime()) < (1000 * 60 * 60 * 24);
  };

  $scope.isDateInCurrentMonth = function(date) {
    var now = new Date();
    return getMonthYear(now) === getMonthYear(date);
  };

  function getMonthYear(date) {
    return date.getMonth() + date.getFullYear();
  }

  $scope.showMore = function() {
    $timeout(function() {
      currentTxHistoryPage++;
      $scope.showHistory();
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }, 100);
  };

  $scope.onRefresh = function() {
    $timeout(function() {
      $scope.$broadcast('scroll.refreshComplete');
    }, 300);
    $scope.updateAll(true);
  };

  $scope.updateAll = function(force, cb)  {
    updateStatus(force);
    updateTxHistory(cb);
  };

  $scope.hideToggle = function() {
    profileService.toggleHideBalanceFlag($scope.wallet.credentials.walletId, function(err) {
      if (err) $log.error(err);
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {

    $scope.wallet = profileService.getWallet(data.stateParams.walletId);
    $scope.requiresMultipleSignatures = $scope.wallet.credentials.m > 1;

    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);
      $scope.addressbook = ab || {};
    });

    $scope.updateAll();

    listeners = [
      $rootScope.$on('bwsEvent', function(e, walletId) {
        if (walletId == $scope.wallet.id)
          updateStatus();
      }),
      $rootScope.$on('Local/TxAction', function(e, walletId) {
        if (walletId == $scope.wallet.id)
          updateStatus();
      }),
    ];
  });

  $scope.$on("$ionicView.leave", function(event, data) {
    lodash.each(listeners, function(x) {
      x();
    });
  });
});
