'use strict';
angular.module('copayApp.controllers').controller('ProfileController', function($scope, $rootScope, $location, $modal, backupService) {
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
    $scope.loading = w.id;

    identityService.deleteWallet(w.id,function() {
      $scope.loading = false;
      $scope.getWallets();
    });
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
