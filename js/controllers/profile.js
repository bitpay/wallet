'use strict';
angular.module('copayApp.controllers').controller('ProfileController', function($scope, $rootScope, $location, controllerUtils, backupService) {
  $scope.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

  $rootScope.title = 'Profile';

  $scope.downloadBackup = function() {
    backupService.profileDownload($rootScope.iden);
  };

  $scope.viewBackup = function() {
    $scope.backupPlainText = backupService.profileEncrypted($rootScope.iden);
    $scope.hideViewBackup = true;
  };
  
  $scope.getWallets = function() {
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
      $scope.loading = false;
      $scope.getWallets();
    });
  };
});
