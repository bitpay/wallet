'use strict';

angular.module('copayApp.controllers').controller('activityController',
  function($timeout, $scope, $log, $ionicModal, lodash, txpModalService, profileService, walletService, ongoingProcess, popupService, gettextCatalog) {
    $scope.openTxpModal = txpModalService.open;

    $scope.init = function() {
      $scope.fetchingNotifications = true;
      profileService.getNotifications(50, function(err, n) {
        if (err) {
          console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
          return;
        }
        $scope.fetchingNotifications = false;
        $scope.notifications = n;

        profileService.getTxps({}, function(err, txps, n) {
          if (err) $log.error(err);
          $scope.txps = txps;
          $timeout(function() {
            $scope.$apply();
          });
        });
      });
    };

    $scope.openNotificationModal = function(n) {
      if (n.txid) {
        openTxModal(n);
      } else {
        var txp = lodash.find($scope.txps, {
          id: n.txpId
        });
        if (txp) txpModalService.open(txp);
        else {
          $log.warn('No txp found');
          return popupService.showAlert(null, gettextCatalog.getString('Transaction not found'));
        }
      }
    };

    var openTxModal = function(n) {
      var wallet = profileService.getWallet(n.walletId);

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
      });
    };
  });
