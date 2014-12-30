'use strict';
angular.module('copayApp.controllers').controller('ProfileController', function($scope, $rootScope, $location, $modal, $filter, $timeout, backupService, identityService, isMobile, isCordova) {
  $scope.username = $rootScope.iden.getName();
  $scope.isSafari = isMobile.Safari();
  $scope.isCordova = isCordova;

  $rootScope.title = 'Profile';
  $scope.hideAdv = true;

  $scope.downloadProfileBackup = function() {
    backupService.profileDownload($rootScope.iden);
  };

  $scope.viewProfileBackup = function() {
    $scope.backupProfilePlainText = backupService.profileEncrypted($rootScope.iden);
    $scope.hideViewProfileBackup = true;
  }; 


  $scope.init = function() {
    if ($rootScope.quotaPerItem) {
      $scope.perItem = $filter('noFractionNumber')($rootScope.quotaPerItem / 1000, 1);
      $scope.nrWallets = parseInt($rootScope.quotaItems) - 1;
    }
    // no need to add event handlers here. Wallet deletion is handle by callback.
  };

  $scope.setWallets = function() {
    if (!$rootScope.iden) return;

    var wallets = $rootScope.iden.getWallets();
    var max = $rootScope.quotaPerItem;

    _.each(wallets, function(w) {
      var bits = w.sizes().total;
      w.kb = $filter('noFractionNumber')(bits / 1000, 1);
      if (max) {
        w.usage = $filter('noFractionNumber')(bits / max * 100, 0);
      }
    });
    $scope.wallets = wallets;
    $timeout(function(){
      $scope.$digest();
    })
  }; 

  $scope.deleteProfile = function() {
    identityService.deleteProfile(function(err, res) {
      if (err) {
        log.warn(err);
        notification.error('Error', 'Could not delete profile');
        return;
      }
      $location.path('/');
      $timeout(function() {
        notification.error('Success', 'Profile successfully deleted');
      });
    });
  };

  $scope.showWalletInfo = function(w) {
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      if (!w) return;
      $scope.isSafari = isMobile.Safari();
      $scope.isCordova = isCordova;
      $scope.item = w;
      $scope.error = null;
      $scope.success = null;

      $scope.deleteWallet = function() {

        $scope.loading = true;
        identityService.deleteWallet($scope.item, function(err) {
          if (err) {
            $scope.loading = null;
            $scope.error = err.message || err;
            copay.logger.warn(err);
            $timeout(function () { $scope.$digest(); });
          } else {
            $modalInstance.close($scope.item.name || $scope.item.id);
          }
        });
      };

      $scope.downloadWalletBackup = function() {
        backupService.walletDownload($scope.item);
      };

      $scope.viewWalletBackup = function() {
        $scope.backupWalletPlainText = backupService.walletEncrypted($scope.item);
      };

      $scope.close = function() {
        $modalInstance.dismiss('cancel');
      };
    }; 

    var modalInstance = $modal.open({
      templateUrl: 'views/modals/wallet-info.html',
      windowClass: 'medium',
      controller: ModalInstanceCtrl
    });

    modalInstance.result.then(function(walletName) {
      $scope.loading = false;
      $scope.success = 'The wallet "' + walletName + '" was deleted';
      $scope.setWallets();
    });
  };
});
