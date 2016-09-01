'use strict';

angular.module('copayApp.controllers').controller('walletDetailsController', function($scope, $rootScope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, $ionicNavBarDelegate, $state, $stateParams, bwcError, profileService, lodash, configService, gettext, gettextCatalog, platformInfo, walletService, $ionicPopup) {

  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var isAndroid = platformInfo.isAndroid;
  var isChromeApp = platformInfo.isChromeApp;

  var errorPopup;

  var HISTORY_SHOW_LIMIT = 10;
  $scope.txps = [];


  var setPendingTxps = function(txps) {
    if (!txps) {
      $scope.txps = [];
      return;
    }
    $scope.txps = lodash.sortBy(txps, 'createdOn').reverse();
  };


  $scope.updateStatus = function(force) {
    $scope.updatingStatus = true;
    $scope.updateStatusError = false;

    walletService.getStatus(wallet, {
      force: !!force,
    }, function(err, status) {
      $scope.updatingStatus = false;
      if (err) {
        $scope.status = null;
        $scope.updateStatusError = true;
        return;
      }

      setPendingTxps(status.pendingTxps);

      $scope.status = status;
      $timeout(function() {
        $scope.$apply();
      }, 1);

    });
  };


  var glideraActive = true; // TODO TODO TODO
  // isGlidera flag is a security measure so glidera status is not
  // only determined by the tx.message
  $scope.openTxpModal = function(tx) {
    var config = configService.getSync().wallet;
    var scope = $rootScope.$new(true);
    scope.tx = tx;
    scope.wallet = tx.wallet;
    scope.copayers = tx.wallet.copayers;
    scope.isGlidera = glideraActive;
    scope.currentSpendUnconfirmed = config.spendUnconfirmed;

    $ionicModal.fromTemplateUrl('views/modals/txp-details.html', {
      scope: scope
    }).then(function(modal) {
      scope.txpDetailsModal = modal;
      scope.txpDetailsModal.show();
    });
  };


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
  };

  $scope.openTxModal = function(btx) {
    var self = this;

    $scope.btx = lodash.cloneDeep(btx);
    $scope.self = self;

    $ionicModal.fromTemplateUrl('views/modals/tx-details.html', {
      scope: $scope,
      hideDelay: 500
    }).then(function(modal) {
      $scope.txDetailsModal = modal;
      $scope.txDetailsModal.show();
    });
  };

  $scope.recreate = function() {
    walletService.recreate();
  };

  $scope.updateTxHistory = function(cb) {

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
  }

  $scope.hideToggle = function() {
    profileService.toggleHideBalanceFlag(wallet.credentials.walletId, function(err) {
      if (err) $log.error(err);
    });
  }

  var currentTxHistoryPage;
  var wallet;

  $scope.init = function() {
    currentTxHistoryPage = 0;
    $scope.completeTxHistory = [];

    wallet = profileService.getWallet($stateParams.walletId);

    if (!wallet.isComplete()) {
      return $state.go('wallet.copayers');
    };

    $scope.wallet = wallet;
    $scope.requiresMultipleSignatures = wallet.credentials.m > 1;
    $scope.newTx = false;

    $ionicNavBarDelegate.title(wallet.name);

    $scope.updateAll(function() {
      if ($stateParams.txid) {
        var tx = lodash.find($scope.completeTxHistory, {
          txid: $stateParams.txid
        });
        if (tx) {
          $scope.openTxModal(tx);
        } else {
          $ionicPopup.alert({
            title: gettext('TX not available'),
          });
        }
      } else if ($stateParams.txpId) {
        var txp = lodash.find($scope.txps, {
          id: $stateParams.txpId
        });
        if (txp) {
          $scope.openTxpModal(txp);
        } else {
          $ionicPopup.alert({
            title: gettext('Proposal not longer available'),
          });
        }
      }
    });
  }
});
