'use strict';

angular.module('copayApp.controllers').controller('walletDetailsController', function($scope, $rootScope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, $ionicNavBarDelegate, $state, $stateParams, bwcError, profileService, lodash, configService, gettext, gettextCatalog, platformInfo, walletService, storageService) {

  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var isAndroid = platformInfo.isAndroid;
  var isChromeApp = platformInfo.isChromeApp;

  var errorPopup;

  var HISTORY_SHOW_LIMIT = 10;

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

  $scope.updateStatus = function(force) {
    $scope.updatingStatus = true;
    $scope.updateStatusError = false;
    $timeout(function() {
      walletService.getStatus(wallet, {
        force: !!force,
      }, function(err, status) {
        $scope.updatingStatus = false;
        if (err) {
          $scope.status = null;
          $scope.updateStatusError = true;
          return;
        }
        $scope.status = status;
      });
    })
  };

  $scope.updateTxHistory = function() {

    if ($scope.updatingTxHistory) return;

    $scope.updatingTxHistory = true;
    $scope.updateTxHistoryError = false;
    $scope.updatingTxHistoryProgress = null;

    var progressFn = function(txs) {
      $scope.updatingTxHistoryProgress = txs ? txs.length : 0;
      $scope.completeTxHistory = txs;
      $scope.showHistory();
      $scope.$digest();
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
        $scope.$apply();
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

  $scope.updateAll = function()  {
    $scope.updateStatus(false);
    $scope.updateTxHistory();
  }

  var hideBalance = function() {
    storageService.getHideBalanceFlag(wallet.credentials.walletId, function(err, shouldHideBalance) {
      if (err) $scope.shouldHideBalance = false;
      else $scope.shouldHideBalance = (shouldHideBalance == 'true') ? true : false;
    });
  }

  $scope.hideToggle = function() {
    $scope.shouldHideBalance = !$scope.shouldHideBalance;
    storageService.setHideBalanceFlag(wallet.credentials.walletId, $scope.shouldHideBalance.toString(), function() {});
  }

  var currentTxHistoryPage;
  var wallet;

  $scope.init = function() {
    currentTxHistoryPage = 0;
    $scope.completeTxHistory = [];

    wallet = profileService.getWallet($stateParams.walletId);
    $scope.wallet = wallet;
    $scope.requiresMultipleSignatures = wallet.credentials.m > 1;
    $scope.newTx = false;

    hideBalance();
    $ionicNavBarDelegate.title(wallet.name);

    $scope.updateAll();
  };

});
