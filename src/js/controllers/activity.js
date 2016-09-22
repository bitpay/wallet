'use strict';

angular.module('copayApp.controllers').controller('activityController',
  function($timeout, $scope, $log, $ionicModal, lodash, txpModalService, profileService, walletService, ongoingProcess, popupService, gettextCatalog) {
    $scope.openTxpModal = txpModalService.open;
    $scope.fetchingNotifications = true;

    $scope.$on("$ionicView.enter", function(event, data){
      profileService.getNotifications(50, function(err, n) {
        if (err) {
          $log.error(err);
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
    });

    $scope.openNotificationModal = function(n) {
      if (n.txid) {
        openTxModal(n);
      } else {
        var txp = lodash.find($scope.txps, {
          id: n.txpId
        });
        if (txp) txpModalService.open(txp);
        else {
          ongoingProcess.set('loadingTxInfo', true);
          walletService.getTxp(n.wallet, n.txpId, function(err, txp) {
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

        walletService.getTxNote(wallet, n.txid, function(err, note) {
          if (err) $log.debug('Could not fetch transaction note');
          $scope.btx.note = note;
        });
      });
    };
  });
