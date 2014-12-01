'use strict';
angular.module('copayApp.controllers').controller('ProfileController', function($scope, $rootScope, $location, $modal, $filter, backupService, identityService) {
  $scope.username = $rootScope.iden.getName();
  $scope.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

  $rootScope.title = 'Profile';

  $scope.downloadProfileBackup = function() {
    backupService.profileDownload($rootScope.iden);
  };

  $scope.viewProfileBackup = function() {
    $scope.backupProfilePlainText = backupService.profileEncrypted($rootScope.iden);
    $scope.hideViewProfileBackup = true;
  };
  
  $scope.deleteWallet = function(w) {
    if (!w) return;
    identityService.deleteWallet(w, function(err) {
      $scope.loading = false;
      if (err) {
        copay.logger.warn(err);
      }
      $scope.setWallets();
    });
  };

  $scope.init = function() {
    if ($rootScope.quotaPerItem) {
      $scope.perItem = $filter('noFractionNumber')($rootScope.quotaPerItem/1000,1);
      $scope.nrWallets =parseInt($rootScope.quotaItems) - 1;
    }
  };

  $scope.setWallets = function() {
    if (!$rootScope.iden) return;

    var wallets = $rootScope.iden.listWallets();
    var max =$rootScope.quotaPerItem;

    _.each(wallets, function(w) {
      var bits = w.sizes().total;
      w.kb = $filter('noFractionNumber')(bits/1000, 1);
      if (max) {
        w.usage =  $filter('noFractionNumber')(bits/max * 100, 0);
      }
    });

    $scope.wallets = wallets;
  };

  $scope.downloadWalletBackup = function(w) {
    if (!w) return;
    backupService.walletDownload(w);
  }

  $scope.viewWalletBackup = function(w) {
    var ModalInstanceCtrl = function($scope, $modalInstance) {

      if (!w) return;
      $scope.backupWalletPlainText = backupService.walletEncrypted(w);
      $scope.hideViewWalletBackup = true;
      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };
    };

    $modal.open({
      templateUrl: 'views/modals/backup-text.html',
      windowClass: 'tiny',
      controller: ModalInstanceCtrl
    });
  };

});
