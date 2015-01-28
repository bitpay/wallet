'use strict';
angular.module('copayApp.controllers').controller('ProfileController', function($scope, $rootScope, $location, $modal, $filter, $timeout, backupService, identityService, isMobile, isCordova, notification) {
  $scope.username = $rootScope.iden.getName();
  $scope.isSafari = isMobile.Safari();
  $scope.isCordova = isCordova;

  $rootScope.title = 'Profile';
  $scope.hideAdv = true;

  $scope.downloadProfileBackup = function() {
    backupService.profileDownload($rootScope.iden);
  };

  $scope.viewProfileBackup = function() {
    $scope.loading = true;
    $timeout(function() {
      $scope.backupProfilePlainText = backupService.profileEncrypted($rootScope.iden);
    }, 100);
  }; 

  $scope.copyProfileBackup = function() {
    var ep = backupService.profileEncrypted($rootScope.iden);
    window.cordova.plugins.clipboard.copy(ep);
    window.plugins.toast.showShortCenter('Copied to clipboard');
  };

  $scope.sendProfileBackup = function() {
    window.plugins.toast.showShortCenter('Preparing backup...');
    var name = $rootScope.iden.fullName;
    var ep = backupService.profileEncrypted($rootScope.iden);
    var properties = {
      subject: 'Copay Profile Backup: ' + name,
      body: 'Here is the encrypted backup of the profile ' 
        + name + ': \n\n' + ep 
        + '\n\n To import this backup, copy all text between {...}, including the symbols {}',
      isHtml:  false
    };
    window.plugin.email.open(properties);
  };

  $scope.init = function() {
    if ($rootScope.quotaPerItem) {
      $scope.perItem = $filter('noFractionNumber')($rootScope.quotaPerItem / 1000, 1);
      $scope.nrWallets = parseInt($rootScope.quotaItems) - 1;
    }
    // no need to add event handlers here. Wallet deletion is handle by callback.
  };

  $scope.deleteProfile = function() {
    $scope.loading = true;
    identityService.deleteProfile(function(err, res) {
      $scope.loading = false;
      if (err) {
        log.warn(err);
        notification.error('Error', 'Could not delete profile');
        $timeout(function () { $scope.$digest(); });
      }
      else {
        $location.path('/');
        $timeout(function() {
          notification.success('Success', 'Profile successfully deleted');
        });
      }
    });
  };
});
