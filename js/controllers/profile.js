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
});
