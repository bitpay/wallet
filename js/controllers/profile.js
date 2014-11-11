'use strict';
angular.module('copayApp.controllers').controller('ProfileController', function($scope, $rootScope, $location, $modal, controllerUtils, backupService) {
  $scope.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

  $rootScope.title = 'Profile';

  $scope.downloadProfileBackup = function() {
    backupService.profileDownload($rootScope.iden);
  };

  $scope.viewProfileBackup = function() {
    $scope.backupProfilePlainText = backupService.profileEncrypted($rootScope.iden);
    $scope.hideViewProfileBackup = true;
  };
  
  $scope.getWallets = function() {
    if (!$rootScope.iden) return;
    $scope.wallets = [];
    var wids = _.pluck($rootScope.iden.listWallets(), 'id');
    _.each(wids, function(wid) {
      var w = $rootScope.iden.getWalletById(wid);
      $scope.wallets.push(w);
      controllerUtils.updateBalance(w, function() {
        $rootScope.$digest();
      }, true);
    });
  };
  
  $scope.deleteWallet = function(w) {
    if (!w) return;
    $scope.loading = w.id;
    controllerUtils.deleteWallet($scope, w, function() {
      if ($rootScope.wallet.id === w.id) {
        $rootScope.wallet = null;
        var lastFocused = $rootScope.iden.getLastFocusedWallet();
        controllerUtils.bindProfile($scope, $rootScope.iden, lastFocused);
      }
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
